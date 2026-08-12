// ============================================================
//  Juara CRM — Cloud Function: backfill spend harian Meta Ads
//  -> juara_campaign_history
//
//  Jalan automatik setiap hari (Cloud Scheduler, terurus oleh
//  Firebase) — tak bergantung pada mana-mana PC. Gantikan
//  run-backfill-meta-spend.cmd (Task Scheduler) di local machine.
//
//  Token dibaca dari Firebase Secret Manager (META_ACCESS_TOKEN),
//  bukan disimpan dalam kod ini.
// ============================================================
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const META_ACCESS_TOKEN = defineSecret("META_ACCESS_TOKEN");
const AD_ACCOUNT_ID = "act_1148870838782150"; // Juara Travel Online
const API_VERSION = "v21.0";
const DAYS = 3; // tangkap semula pembetulan lewat Meta

function todayMY() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(new Date());
}
function addDaysStr(ymdStr, n) {
  const [y, m, d] = ymdStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}
function docIdFor(campaignName, date) {
  return `${campaignName}__${date}`.toLowerCase().replace(/[^a-z0-9_]+/g, "-").slice(0, 300);
}
// Mirrors public/domain/campaigns.mjs normCampaignName() — kept in sync manually
// since Cloud Functions (CommonJS) can't import that browser ESM module directly.
function normCampaignName(n) {
  return String(n || "").trim().toLowerCase().replace(/[–—−]/g, "-").replace(/\s+/g, " ");
}

async function metaGet(url) {
  const res = await fetch(url);
  const json = await res.json();
  if (json.error) throw new Error(`Meta API error: ${json.error.message} (code ${json.error.code})`);
  return json;
}

async function fetchDailySpend(token, since, until) {
  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  let url =
    `https://graph.facebook.com/${API_VERSION}/${AD_ACCOUNT_ID}/insights` +
    `?level=campaign&time_increment=1&time_range=${timeRange}` +
    `&fields=campaign_name,spend&limit=500&access_token=${token}`;
  const rows = [];
  while (url) {
    const json = await metaGet(url);
    rows.push(...(json.data || []));
    url = json.paging && json.paging.next ? json.paging.next : null;
  }
  return rows;
}

async function fetchCampaigns(token) {
  let url =
    `https://graph.facebook.com/${API_VERSION}/${AD_ACCOUNT_ID}/campaigns` +
    `?fields=name,daily_budget,lifetime_budget,start_time,stop_time` +
    `&limit=200&access_token=${token}`;
  const rows = [];
  while (url) {
    const json = await metaGet(url);
    rows.push(...(json.data || []));
    url = json.paging && json.paging.next ? json.paging.next : null;
  }
  return rows;
}

// Creates a juara_campaigns doc for any Meta campaign not already registered in
// the CRM, so new campaigns show up on the Kempen Iklan page without manual
// data entry. Never touches existing docs — budget/pakejLink/dates already set
// by staff are left alone.
async function syncNewCampaigns(token) {
  const [metaCampaigns, existingSnap] = await Promise.all([
    fetchCampaigns(token),
    db.collection("juara_campaigns").get(),
  ]);
  const existingNames = new Set(existingSnap.docs.map((d) => normCampaignName(d.data().name)));

  const batch = db.batch();
  let added = 0;
  for (const c of metaCampaigns) {
    const name = (c.name || "").trim();
    if (!name || existingNames.has(normCampaignName(name))) continue;
    const budgetSen = parseFloat(c.daily_budget || c.lifetime_budget || 0) || 0;
    batch.set(db.collection("juara_campaigns").doc(), {
      name,
      platform: "Meta Ads",
      budget: budgetSen / 100,
      spend: 0,
      dateStart: c.start_time ? c.start_time.slice(0, 10) : "",
      dateEnd: c.stop_time ? c.stop_time.slice(0, 10) : "",
      pakejLink: "",
      source: "meta-auto",
      createdAt: new Date().toISOString(),
    });
    existingNames.add(normCampaignName(name));
    added++;
  }
  if (added) await batch.commit();
  return added;
}

exports.backfillMetaSpend = onSchedule(
  {
    schedule: "0 6 * * *",
    timeZone: "Asia/Kuala_Lumpur",
    secrets: [META_ACCESS_TOKEN],
    retryCount: 2,
  },
  async () => {
    const until = todayMY();
    const since = addDaysStr(until, -(DAYS - 1));
    logger.info(`Tarik spend harian ${since} hingga ${until} dari ${AD_ACCOUNT_ID}`);

    const token = META_ACCESS_TOKEN.value();
    const rows = await fetchDailySpend(token, since, until);
    logger.info(`${rows.length} baris (kempen x hari) diterima daripada Meta`);

    const batch = db.batch();
    for (const r of rows) {
      const date = r.date_start;
      const campaignName = r.campaign_name || "(tanpa nama)";
      const spend = parseFloat(r.spend) || 0;
      const id = docIdFor(campaignName, date);
      batch.set(
        db.collection("juara_campaign_history").doc(id),
        { date, campaignName, spend, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    }
    await batch.commit();
    logger.info(`Selesai. ${rows.length} rekod ditulis ke juara_campaign_history.`);

    const added = await syncNewCampaigns(token);
    logger.info(`${added} kempen baharu ditambah ke juara_campaigns.`);
  }
);

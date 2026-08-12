// ============================================================
//  Juara CRM — Backfill spend harian Meta Ads -> juara_campaign_history
//
//  Kenapa skrip ni wujud: dashboard papar "—" untuk Kos Iklan/CPL/ROAS
//  pada semua filter selain "Bulan Ini" sebab collection
//  juara_campaign_history tak pernah diisi rekod harian (lihat
//  spendDashRange() dalam public/index.html). Skrip ni tarik spend
//  harian sebenar dari Meta Marketing API dan isi collection tu.
//
//  Cara jalankan (PowerShell):
//    $env:META_ACCESS_TOKEN = "EAA..."          # token baharu, JANGAN commit
//    node backfill-meta-spend.mjs
//
//  Optional env vars:
//    META_AD_ACCOUNT_ID   act_xxxxxxxxx (kalau token ada akses > 1 akaun)
//    META_BACKFILL_DAYS   berapa hari ke belakang (default 30)
//
//  Token TIDAK disimpan dalam fail ini — ia dibaca dari environment
//  variable sahaja. Jangan hardcode token terus dalam fail/commit.
//
//  Skrip ni idempoten (guna doc ID tetap + merge), jadi selamat
//  dijalankan berulang kali (cth. cron/Task Scheduler harian) untuk
//  terus kemaskini rekod spend harian.
// ============================================================
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const cfg = {
  apiKey: "AIzaSyDoeFDNz1bEFr1uAmPz4gtu8c71LvJDcok",
  authDomain: "akmal-crm-2026-c8a29.firebaseapp.com",
  projectId: "akmal-crm-2026-c8a29",
  storageBucket: "akmal-crm-2026-c8a29.firebasestorage.app",
  messagingSenderId: "403408115667",
  appId: "1:403408115667:web:0630b672299bc03a304126",
};

// Tukar ke false untuk simpan betul-betul. Biar true dulu untuk PREVIEW
// dan sahkan nama kempen/nombor spend nampak munasabah sebelum tulis.
const DRY_RUN = false;

const API_VERSION = "v21.0";
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;
const DAYS = parseInt(process.env.META_BACKFILL_DAYS || "30", 10);

if (!ACCESS_TOKEN) {
  console.error("Sila set environment variable META_ACCESS_TOKEN dulu, contoh:");
  console.error('  $env:META_ACCESS_TOKEN = "EAA..."   (PowerShell)');
  process.exit(1);
}

const app = initializeApp(cfg);
const db = getFirestore(app);

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

async function metaGet(url) {
  const res = await fetch(url);
  const json = await res.json();
  if (json.error) throw new Error(`Meta API error: ${json.error.message} (code ${json.error.code})`);
  return json;
}

async function resolveAdAccount() {
  if (AD_ACCOUNT_ID) return AD_ACCOUNT_ID.startsWith("act_") ? AD_ACCOUNT_ID : `act_${AD_ACCOUNT_ID}`;
  const json = await metaGet(
    `https://graph.facebook.com/${API_VERSION}/me/adaccounts?fields=account_id,name&access_token=${ACCESS_TOKEN}`
  );
  const accounts = json.data || [];
  if (accounts.length === 0) throw new Error("Token ini tiada akses ke mana-mana akaun iklan.");
  if (accounts.length === 1) {
    console.log(`Guna akaun: ${accounts[0].name} (act_${accounts[0].account_id})`);
    return `act_${accounts[0].account_id}`;
  }
  console.log("Token ini ada akses ke lebih daripada satu akaun iklan:");
  accounts.forEach((a) => console.log(`  act_${a.account_id}  —  ${a.name}`));
  throw new Error("Sila set env var META_AD_ACCOUNT_ID kepada salah satu act_... di atas, kemudian jalankan semula.");
}

async function fetchDailySpend(actId, since, until) {
  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  let url =
    `https://graph.facebook.com/${API_VERSION}/${actId}/insights` +
    `?level=campaign&time_increment=1&time_range=${timeRange}` +
    `&fields=campaign_name,spend&limit=500&access_token=${ACCESS_TOKEN}`;
  const rows = [];
  while (url) {
    const json = await metaGet(url);
    rows.push(...(json.data || []));
    url = json.paging && json.paging.next ? json.paging.next : null;
  }
  return rows;
}

async function run() {
  console.log(DRY_RUN ? "=== MODE PREVIEW (tiada apa disimpan) ===\n" : "=== MODE LIVE (simpan betul) ===\n");

  const actId = await resolveAdAccount();
  const until = todayMY();
  const since = addDaysStr(until, -(DAYS - 1));
  console.log(`Tarik spend harian ${since} hingga ${until} dari ${actId}...\n`);

  const rows = await fetchDailySpend(actId, since, until);
  console.log(`${rows.length} baris (kempen x hari) diterima daripada Meta.\n`);

  let written = 0;
  for (const r of rows) {
    const date = r.date_start;
    const campaignName = r.campaign_name || "(tanpa nama)";
    const spend = parseFloat(r.spend) || 0;
    const id = docIdFor(campaignName, date);
    console.log(`  ${DRY_RUN ? "[PREVIEW]" : "SET"} ${date}  ${campaignName}  RM ${spend.toFixed(2)}`);
    if (!DRY_RUN) {
      await setDoc(
        doc(db, "juara_campaign_history", id),
        { date, campaignName, spend, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    }
    written++;
  }

  console.log(`\nSelesai. ${written} rekod ${DRY_RUN ? "akan ditulis" : "ditulis"} ke juara_campaign_history.`);
  console.log("(Auto-tambah kempen baharu ke juara_campaigns hanya berlaku via Cloud Function backfillMetaSpend — skrip manual ni tiada akses baca juara_campaigns akibat Firestore rules.)");

  if (DRY_RUN) console.log("Ini PREVIEW sahaja. Tukar DRY_RUN=false dalam fail ni untuk simpan betul-betul.");
  console.log("Buka CRM dan tekan Ctrl+Shift+R.");
  process.exit(0);
}

run().catch((err) => {
  console.error("\nGAGAL:", err.message);
  process.exit(1);
});

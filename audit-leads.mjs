// ============================================================
//  Juara CRM — Audit Leads & Sales (baca sahaja, tak ubah apa-apa)
//  Jalankan: node audit-leads.mjs   (dari folder my-crm)
// ============================================================
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { closedDate } from "./public/domain/leads.mjs";

const cfg = {
  apiKey: "AIzaSyDoeFDNz1bEFr1uAmPz4gtu8c71LvJDcok",
  authDomain: "akmal-crm-2026-c8a29.firebaseapp.com",
  projectId: "akmal-crm-2026-c8a29",
  storageBucket: "akmal-crm-2026-c8a29.firebasestorage.app",
  messagingSenderId: "403408115667",
  appId: "1:403408115667:web:0630b672299bc03a304126",
};

const app = initializeApp(cfg);
const db = getFirestore(app);

const BULAN = ["Jan","Feb","Mac","Apr","Mei","Jun","Jul","Ogos","Sep","Okt","Nov","Dis"];
function key(raw) {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth()).padStart(2,"0")}`;
}
function label(k) { const [y,m] = k.split("-"); return `${BULAN[+m]} ${y}`; }
function fmtRM(n) { return "RM " + Math.round(n).toLocaleString(); }

async function run() {
  const snap = await getDocs(collection(db, "juara_leads"));
  const leads = snap.docs.map(x => ({ id: x.id, ...x.data() }));

  const leadsByMonth = {};   // ikut tarikh MASUK
  const salesByMonth = {};   // ikut tarikh CLOSE
  const flags = [];

  for (const l of leads) {
    // Leads ikut tarikh masuk
    const kIn = key(l.date || l.createdAt);
    if (kIn) leadsByMonth[kIn] = (leadsByMonth[kIn] || 0) + 1;
    else flags.push(`TIADA tarikh masuk: ${l.name || l.id}`);

    if (l.status === "Closed") {
      const closed = closedDate(l);
      const kClose = closed.getTime() ? key(closed) : null;
      const val = parseFloat(l.value) || 0;
      const pax = parseInt(l.pax) || 1;

      if (kClose) {
        if (!salesByMonth[kClose]) salesByMonth[kClose] = { count: 0, pax: 0, rm: 0 };
        salesByMonth[kClose].count++;
        salesByMonth[kClose].pax += pax;
        salesByMonth[kClose].rm += val;
      }

      // Bendera merah
      if (!l.closedAt) flags.push(`Closed tapi TIADA closedAt (guna anggaran): ${l.name || l.id}`);
      if (val <= 0) flags.push(`Closed tapi nilai RM0: ${l.name || l.id}`);
      if (kIn && kClose && kClose < kIn) flags.push(`Close SEBELUM masuk (pelik): ${l.name || l.id} — masuk ${label(kIn)}, close ${label(kClose)}`);
    }
  }

  console.log("========================================");
  console.log("  LEADS (ikut bulan MASUK ke CRM)");
  console.log("========================================");
  Object.keys(leadsByMonth).sort().forEach(k => console.log(`  ${label(k).padEnd(12)} : ${leadsByMonth[k]} leads`));

  console.log("\n========================================");
  console.log("  SALES (ikut bulan DI-CLOSE)");
  console.log("========================================");
  Object.keys(salesByMonth).sort().forEach(k => {
    const s = salesByMonth[k];
    console.log(`  ${label(k).padEnd(12)} : ${s.count} closed · ${s.pax} PAX · ${fmtRM(s.rm)}`);
  });

  const totalClosed = leads.filter(l => l.status === "Closed").length;
  const totalRM = leads.filter(l => l.status === "Closed").reduce((a,l)=>a+(parseFloat(l.value)||0),0);
  console.log(`\n  JUMLAH: ${leads.length} leads, ${totalClosed} closed, ${fmtRM(totalRM)} sales`);

  console.log("\n========================================");
  console.log("  BENDERA MERAH (perlu semak)");
  console.log("========================================");
  if (!flags.length) console.log("  Tiada. Semua nampak elok.");
  else flags.forEach(f => console.log(`  ⚠  ${f}`));

  process.exit(0);
}

run();

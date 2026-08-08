// ============================================================
//  Juara CRM — Betulkan Sales Data Lama (backfill sahaja)
//  Isi closedAt = tarikh MASUK untuk lead Closed yang BELUM ada closedAt.
//  Lead yang sudah ada closedAt sebenar (contoh: di-Close selepas
//  refactor domain/leads.mjs) TIDAK akan disentuh — skrip ini tidak lagi
//  force-overwrite semua lead Closed, sebab itu boleh musnahkan closedAt
//  sebenar kalau skrip ini dijalankan semula secara tidak sengaja.
//
//  Jalankan: node betulkan-sales.mjs   (dari folder my-crm)
// ============================================================
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { parseCRMDate } from "./public/domain/leads.mjs";

const cfg = {
  apiKey: "AIzaSyDoeFDNz1bEFr1uAmPz4gtu8c71LvJDcok",
  authDomain: "akmal-crm-2026-c8a29.firebaseapp.com",
  projectId: "akmal-crm-2026-c8a29",
  storageBucket: "akmal-crm-2026-c8a29.firebasestorage.app",
  messagingSenderId: "403408115667",
  appId: "1:403408115667:web:0630b672299bc03a304126",
};

// true = PREVIEW sahaja (tak simpan). false = simpan betul.
const DRY_RUN = true;

const app = initializeApp(cfg);
const db = getFirestore(app);
const BULAN = ["Jan","Feb","Mac","Apr","Mei","Jun","Jul","Ogos","Sep","Okt","Nov","Dis"];

async function run() {
  const snap = await getDocs(collection(db, "juara_leads"));
  const leads = snap.docs.map(x => ({ id: x.id, ...x.data() }));

  const perBulan = {};
  let touched = 0, skipped = 0, notClosed = 0, noDate = 0;

  for (const l of leads) {
    if (l.status !== "Closed") { notClosed++; continue; }
    if (l.closedAt) { skipped++; continue; }   // sudah ada closedAt sebenar — jangan sentuh

    const entry = l.date || l.createdAt;
    if (!entry) { console.log(`  SKIP (tiada tarikh masuk): ${l.name || l.id}`); noDate++; continue; }

    const d = parseCRMDate(entry);
    const iso = d.toISOString();
    const bulan = `${BULAN[d.getMonth()]} ${d.getFullYear()}`;
    perBulan[bulan] = (perBulan[bulan] || 0) + (parseFloat(l.value) || 0);

    console.log(`  ${DRY_RUN ? "[PREVIEW]" : "SET"} ${(l.name||"(tanpa nama)").padEnd(28)} -> ${bulan}  (RM ${(parseFloat(l.value)||0).toLocaleString()})`);
    if (!DRY_RUN) await updateDoc(doc(db, "juara_leads", l.id), { closedAt: iso });
    touched++;
  }

  console.log("\n---- Sales lama ikut bulan (selepas betulkan) ----");
  Object.keys(perBulan).sort().forEach(b => console.log(`  ${b.padEnd(12)} : RM ${Math.round(perBulan[b]).toLocaleString()}`));
  console.log(`\n${DRY_RUN ? "[PREVIEW] " : ""}${touched} lead ${DRY_RUN ? "akan dibetulkan" : "dibetulkan"}, ${skipped} sudah ada closedAt (dibiarkan), ${notClosed} bukan Closed, ${noDate} tiada tarikh.`);
  if (DRY_RUN) console.log("\nIni PREVIEW sahaja. Kalau nampak betul, tukar DRY_RUN jadi false dan run semula.");
  else console.log("\nSelesai. Buka CRM dan tekan Ctrl+Shift+R.");
  process.exit(0);
}

console.log(DRY_RUN ? "=== MODE PREVIEW (tiada apa disimpan) ===\n" : "=== MODE LIVE (simpan betul) ===\n");
run();

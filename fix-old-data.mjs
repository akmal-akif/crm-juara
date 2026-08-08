// ============================================================
//  Juara CRM — Betulkan data lama (pukal)
//  Set closedAt = tarikh MASUK untuk lead Closed lama yang belum ada closedAt.
//  Ini memulihkan laporan sejarah (cth: Jun kembali ke jumlah asal),
//  tanpa menyentuh lead baru yang sudah ada closedAt sebenar.
//
//  Jalankan: node fix-old-data.mjs   (dari folder my-crm)
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

// Skrip ini hanya BACKFILL: ia tak pernah tulis-ganti closedAt yang sudah
// wujud, walaupun DRY_RUN=false. FORCE-overwrite (guna tarikh masuk untuk
// SEMUA lead Closed) sudah dibuang sebab ia boleh musnahkan closedAt sebenar
// kalau skrip ini dijalankan semula secara tidak sengaja.

const app = initializeApp(cfg);
const db = getFirestore(app);
const BULAN = ["Jan","Feb","Mac","Apr","Mei","Jun","Jul","Ogos","Sep","Okt","Nov","Dis"];

async function run() {
  const snap = await getDocs(collection(db, "juara_leads"));
  const leads = snap.docs.map(x => ({ id: x.id, ...x.data() }));

  const perBulan = {};
  let touched = 0, skipped = 0, notClosed = 0;

  for (const l of leads) {
    if (l.status !== "Closed") { notClosed++; continue; }
    if (l.closedAt) { skipped++; continue; }   // sudah ada closedAt sebenar — jangan sentuh

    const entry = l.date || l.createdAt;                // tarikh MASUK
    if (!entry) { console.log(`  ⚠ SKIP (tiada tarikh masuk): ${l.name || l.id}`); continue; }

    const d = parseCRMDate(entry);
    const bulan = `${BULAN[d.getMonth()]} ${d.getFullYear()}`;
    perBulan[bulan] = (perBulan[bulan] || 0) + (parseFloat(l.value) || 0);

    console.log(`  ${DRY_RUN ? "[PREVIEW]" : "SET"} ${(l.name||"(tanpa nama)").padEnd(28)} -> ${bulan}  (RM ${(parseFloat(l.value)||0).toLocaleString()})`);
    if (!DRY_RUN) await updateDoc(doc(db, "juara_leads", l.id), { closedAt: d.toISOString() });
    touched++;
  }

  console.log("\n---- Ringkasan sales lama ikut bulan (selepas betulkan) ----");
  Object.keys(perBulan).sort().forEach(b => console.log(`  ${b.padEnd(12)} : RM ${Math.round(perBulan[b]).toLocaleString()}`));
  console.log(`\n${DRY_RUN ? "[PREVIEW] " : ""}${touched} lead ${DRY_RUN ? "akan dibetulkan" : "dibetulkan"}, ${skipped} sudah ada closedAt (lead baru — dibiarkan), ${notClosed} bukan Closed.`);
  if (DRY_RUN) console.log("\nIni PREVIEW sahaja. Kalau nampak betul, tukar DRY_RUN jadi false dan run semula.");
  else console.log("\nSelesai. Buka CRM, tekan Ctrl+Shift+R.");
  process.exit(0);
}

console.log(DRY_RUN ? "=== MODE PREVIEW (tiada apa disimpan) ===\n" : "=== MODE LIVE (simpan betul) ===\n");
run();

// ============================================================
//  Juara CRM — Betulkan Sales Data Lama (terus simpan)
//  Set closedAt = tarikh MASUK untuk SEMUA lead Closed.
//  Ini memulihkan laporan bulanan supaya konsisten dengan tarikh lead masuk.
//  Lead baru yang di-Close selepas ini akan guna tarikh Close sebenar.
//
//  Jalankan: node betulkan-sales.mjs   (dari folder my-crm)
// ============================================================
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

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

async function run() {
  console.log("=== BETULKAN SALES DATA LAMA (simpan betul) ===\n");
  const snap = await getDocs(collection(db, "juara_leads"));
  const leads = snap.docs.map(x => ({ id: x.id, ...x.data() }));

  const perBulan = {};
  let touched = 0, notClosed = 0, noDate = 0;

  for (const l of leads) {
    if (l.status !== "Closed") { notClosed++; continue; }
    const entry = l.date || l.createdAt;
    if (!entry) { console.log(`  SKIP (tiada tarikh masuk): ${l.name || l.id}`); noDate++; continue; }

    const iso = new Date(entry).toISOString();
    const d = new Date(entry);
    const bulan = `${BULAN[d.getMonth()]} ${d.getFullYear()}`;
    perBulan[bulan] = (perBulan[bulan] || 0) + (parseFloat(l.value) || 0);

    await updateDoc(doc(db, "juara_leads", l.id), { closedAt: iso });
    console.log(`  SET ${(l.name||"(tanpa nama)").padEnd(28)} -> ${bulan}  (RM ${(parseFloat(l.value)||0).toLocaleString()})`);
    touched++;
  }

  console.log("\n---- Sales lama ikut bulan (selepas betulkan) ----");
  Object.keys(perBulan).sort().forEach(b => console.log(`  ${b.padEnd(12)} : RM ${Math.round(perBulan[b]).toLocaleString()}`));
  console.log(`\nSelesai. ${touched} lead dibetulkan, ${notClosed} bukan Closed, ${noDate} tiada tarikh.`);
  console.log("Buka CRM dan tekan Ctrl+Shift+R.");
  process.exit(0);
}

run();

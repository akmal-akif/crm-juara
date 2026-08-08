// ============================================================
//  Juara CRM — Isi 'closedAt' untuk lead Closed lama (pukal)
//  Jalankan: node backfill-closedat.mjs   (dari folder my-crm)
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

// Tukar ke true kalau nak PREVIEW dulu (tak simpan apa-apa, cuma tunjuk).
// Biar false untuk update betul.
const DRY_RUN = false;

const app = initializeApp(cfg);
const db = getFirestore(app);

function pickCloseDate(d) {
  // Anggaran tarikh di-Close: guna updatedAt (kali terakhir rekod diubah),
  // kalau takde guna tarikh lead masuk (date / createdAt).
  return d.updatedAt || d.date || d.createdAt || new Date().toISOString();
}

async function run() {
  const snap = await getDocs(collection(db, "juara_leads"));
  const leads = snap.docs.map(x => ({ id: x.id, data: x.data() }));

  let touched = 0, skipped = 0, notClosed = 0;
  for (const { id, data } of leads) {
    if (data.status !== "Closed") { notClosed++; continue; }
    if (data.closedAt) { skipped++; continue; } // sudah ada, jangan sentuh

    const closedAt = pickCloseDate(data);
    const bulan = new Date(closedAt).toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur", month: "short", year: "numeric" });
    console.log(`  ${DRY_RUN ? "[PREVIEW]" : "SET"} ${data.name || "(tanpa nama)"} -> closedAt ${bulan}`);

    if (!DRY_RUN) await updateDoc(doc(db, "juara_leads", id), { closedAt });
    touched++;
  }

  console.log(`\nSelesai. ${touched} lead ${DRY_RUN ? "akan dikemaskini" : "dikemaskini"}, ${skipped} sudah ada closedAt, ${notClosed} bukan Closed.`);
  console.log("Buka CRM dan tekan Ctrl+Shift+R.");
  process.exit(0);
}

console.log(DRY_RUN ? "=== MODE PREVIEW (tiada apa disimpan) ===\n" : "=== MODE LIVE (simpan betul) ===\n");
run();

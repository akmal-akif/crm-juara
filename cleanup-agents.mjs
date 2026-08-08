// ============================================================
//  Juara CRM — Buang rekod pendua (agent & pakej)
//  Jalankan: node cleanup-agents.mjs   (dari folder my-crm)
// ============================================================
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const cfg = {
  apiKey: "AIzaSyDoeFDNz1bEFr1uAmPz4gtu8c71LvJDcok",
  authDomain: "akmal-crm-2026-c8a29.firebaseapp.com",
  projectId: "akmal-crm-2026-c8a29",
  storageBucket: "akmal-crm-2026-c8a29.firebasestorage.app",
  messagingSenderId: "403408115667",
  appId: "1:403408115667:web:0630b672299bc03a304126",
};

// Tukar ke true kalau nak PREVIEW dulu (tak padam apa-apa, cuma tunjuk).
// Biar false untuk padam betul.
const DRY_RUN = false;

const app = initializeApp(cfg);
const db = getFirestore(app);

async function dedupe(collName) {
  const snap = await getDocs(collection(db, collName));
  const docs = snap.docs.map(d => ({ id: d.id, data: d.data() }));
  const byName = {};
  for (const d of docs) {
    const name = (d.data.name || "").trim();
    if (!name) continue;
    (byName[name] = byName[name] || []).push(d);
  }
  let kept = 0, deleted = 0;
  for (const name of Object.keys(byName)) {
    const group = byName[name];
    if (group.length <= 1) { kept++; continue; }
    // Simpan rekod paling lengkap (contoh: yang ada nombor telefon).
    group.sort((a, b) => Object.keys(b.data).length - Object.keys(a.data).length);
    kept++;
    for (let i = 1; i < group.length; i++) {
      console.log(`  ${DRY_RUN ? "[PREVIEW] akan padam" : "PADAM"}: ${collName}/${group[i].id}  (${name})`);
      if (!DRY_RUN) await deleteDoc(doc(db, collName, group[i].id));
      deleted++;
    }
  }
  console.log(`${collName}: ${kept} nama unik disimpan, ${deleted} pendua ${DRY_RUN ? "akan dibuang" : "dibuang"}.\n`);
}

console.log(DRY_RUN ? "=== MODE PREVIEW (tiada apa dipadam) ===\n" : "=== MODE LIVE (padam betul) ===\n");
await dedupe("juara_agents");
await dedupe("juara_packages");
console.log("Selesai. Buka CRM dan tekan Ctrl+Shift+R.");
process.exit(0);

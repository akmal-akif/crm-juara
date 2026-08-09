// ============================================================
// JUARA CRM — Clean Duplicate Agents & Packages
// Guna sekali sahaja. Lepas selesai, boleh padam fail ni.
//
// CARA GUNA:
//   1. Simpan fail ni dalam C:\Users\user\my-crm
//   2. Buka terminal di folder tu, taip: node cleanup-dupes.mjs
//   3. Kali PERTAMA — DRY_RUN = true, dia CUMA tunjuk apa nak padam
//   4. Bila dah puas hati, tukar DRY_RUN kepada false di bawah,
//      run sekali lagi. Kali ni betul-betul padam.
// ============================================================

const DRY_RUN = true;  // PREVIEW dulu — tukar ke false untuk padam betul

import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, getDocs, deleteDoc, doc
} from "firebase/firestore";
import { normAgentKey, agentCompletenessScore } from "./public/domain/agents.mjs";

const fbCfg = {
  apiKey: "AIzaSyDoeFDNz1bEFr1uAmPz4gtu8c71LvJDcok",
  authDomain: "akmal-crm-2026-c8a29.firebaseapp.com",
  projectId: "akmal-crm-2026-c8a29",
  storageBucket: "akmal-crm-2026-c8a29.firebasestorage.app",
  messagingSenderId: "403408115667",
  appId: "1:403408115667:web:0630b672299bc03a304126",
};

const app = initializeApp(fbCfg);
const db = getFirestore(app);

async function dedupe(collName, keyField = "name") {
  console.log(`\n=== ${collName} ===`);
  const snap = await getDocs(collection(db, collName));
  const docs = snap.docs.map(d => ({ id: d.id, data: d.data() }));
  console.log(`Jumlah dokumen sedia ada: ${docs.length}`);

  // Kumpul ikut nama (case-insensitive, trim)
  const groups = {};
  for (const d of docs) {
    const key = normAgentKey(d.data[keyField]);
    if (!key) {
      console.log(`  ⚠ Dokumen ${d.id} takde "${keyField}" — dilangkau (tak disentuh)`);
      continue;
    }
    (groups[key] ||= []).push(d);
  }

  let toDelete = [];
  for (const [key, arr] of Object.entries(groups)) {
    if (arr.length <= 1) continue; // takde duplicate

    // Susun: yang paling lengkap di depan (nak KEKAL), yang lain padam
    arr.sort((a, b) => agentCompletenessScore(b.data) - agentCompletenessScore(a.data));
    const keep = arr[0];
    const dupes = arr.slice(1);

    console.log(`\n  "${keep.data[keyField]}" — jumpa ${arr.length} salinan:`);
    console.log(`    ✓ KEKAL  : ${keep.id} (skor ${agentCompletenessScore(keep.data)})`);
    for (const dup of dupes) {
      console.log(`    ✗ PADAM  : ${dup.id} (skor ${agentCompletenessScore(dup.data)})`);
      toDelete.push({ coll: collName, id: dup.id });
    }
  }

  if (toDelete.length === 0) {
    console.log("  ✅ Takde duplicate. Bersih.");
    return 0;
  }

  if (DRY_RUN) {
    console.log(`\n  [DRY RUN] ${toDelete.length} dokumen AKAN dipadam (belum dipadam lagi).`);
  } else {
    for (const t of toDelete) {
      await deleteDoc(doc(db, t.coll, t.id));
    }
    console.log(`\n  🗑  ${toDelete.length} dokumen duplicate BERJAYA dipadam.`);
  }
  return toDelete.length;
}

async function main() {
  console.log(DRY_RUN
    ? ">>> MOD: DRY RUN (preview sahaja, tiada apa dipadam)"
    : ">>> MOD: LIVE (dokumen akan dipadam betul-betul!)");

  let total = 0;
  total += await dedupe("juara_agents");
  total += await dedupe("juara_packages");

  console.log("\n============================================");
  if (DRY_RUN) {
    console.log(`Preview siap. ${total} dokumen akan dipadam.`);
    console.log("Kalau ok, tukar DRY_RUN = false, run sekali lagi.");
  } else {
    console.log(`Siap. ${total} dokumen duplicate dipadam.`);
    console.log("Refresh CRM — dropdown patut dah tak double.");
  }
  console.log("============================================");
  process.exit(0);
}

main().catch(err => {
  console.error("RALAT:", err);
  process.exit(1);
});

#!/usr/bin/env node
/*
 * Juara Travel CRM — Patah balik warna BIRU asal + logo dalam kad putih
 * =====================================================================
 * Jalankan pada fail yang SUDAH ada tema merah (penampal branding).
 *
 * CARA GUNA:
 *     node apply_revert_branding.mjs public\index.html
 *
 * Apa ia buat:
 *   - Tukar warna merah -> biru asal (butang, nav, pautan, splash, gradient)
 *   - Logo diletak dalam KAD PUTIH (loading + sidebar) supaya tulisan nampak
 *   - (Login sudah atas kad putih, jadi kekal)
 *
 * PENTING: Ganti public\logo-juara.png dengan logo ASAL (latar putih), bukan telus.
 */

import fs from "fs";

function die(m){ console.error("\nRALAT: "+m+"\n"); process.exit(1); }
function replaceOnce(text, oldStr, newStr, label){
  const i = text.indexOf(oldStr);
  if(i===-1) die(`Tak jumpa '${label}'.`);
  if(text.indexOf(oldStr, i+1)!==-1) die(`'${label}' dijumpai lebih sekali — tak selamat.`);
  return text.slice(0,i)+newStr+text.slice(i+oldStr.length);
}
function replaceAll(text, oldStr, newStr){ return text.split(oldStr).join(newStr); }

function main(){
  const src = process.argv[2];
  if(!src) die("Beri nama fail. Contoh: node apply_revert_branding.mjs public\\index.html");
  if(!fs.existsSync(src)) die(`Fail '${src}' tak wujud.`);
  let html = fs.readFileSync(src,"utf8");

  if(!html.includes("#c8102e")) die("Fail ini tiada tema merah. Mungkin sudah biru.");

  // ===== A) Merah -> Biru asal =====
  html = replaceAll(html, "#c8102e", "#2563eb");
  html = replaceAll(html, "#a00d24", "#1d4ed8");
  html = replaceAll(html, "rgba(200,16,46,", "rgba(37,99,235,");
  html = replaceAll(html,
    "linear-gradient(135deg,#1a0507 0%,#7a0f1a 100%)",
    "linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)");

  // ===== B) Logo splash dalam kad putih =====
  html = replaceOnce(html,
`  <img src="logo-juara.png" alt="Juara Travel" style="width:220px;max-width:70vw;margin-bottom:8px">
  <div style="color:#f8b4bd;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;margin-bottom:22px">CRM System</div>`,
`  <div style="background:#fff;padding:16px 24px;border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,0.25);margin-bottom:16px"><img src="logo-juara.png" alt="Juara Travel" style="width:200px;max-width:60vw;display:block"></div>
  <div style="color:#94a3b8;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;margin-bottom:22px">CRM System</div>`,
    "splash logo card");

  // ===== C) Logo sidebar dalam kad putih =====
  html = replaceOnce(html,
`      <img src="logo-juara.png" alt="Juara Travel" style="width:150px;max-width:90%;display:block;margin-bottom:4px">
      <div class="s-brand-sub">CRM System</div>`,
`      <div style="background:#fff;padding:8px 12px;border-radius:10px;margin-bottom:8px;display:inline-block"><img src="logo-juara.png" alt="Juara Travel" style="width:130px;max-width:100%;display:block"></div>
      <div class="s-brand-sub">CRM System</div>`,
    "sidebar logo card");

  fs.writeFileSync("index.html", html, "utf8");
  console.log("\n✅ SIAP! Warna biru asal + logo dalam kad putih: index.html");
  console.log("\n⚠️  WAJIB: ganti public\\logo-juara.png dengan logo ASAL (latar putih).");
  console.log("\nLangkah seterusnya:");
  console.log("  1. Salin logo ASAL (latar putih) ke public\\logo-juara.png (timpa yang telus).");
  console.log("  2. move /Y index.html public\\index.html");
  console.log("  3. firebase deploy --only hosting");
  console.log("  4. Ctrl+Shift+R.\n");
}
main();

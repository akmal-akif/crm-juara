#!/usr/bin/env node
/*
 * Juara Travel CRM — Jenama: Logo sebenar + Warna Merah
 * ======================================================
 * Jalankan pada fail yang SUDAH ada splash (penampal sebelum ini).
 *
 * CARA GUNA:
 *     node apply_branding.mjs public\index.html
 *
 * Apa ia buat:
 *   - Tukar logo kapal terbang -> logo sebenar Juara Travel (loading, login, sidebar)
 *   - Selaraskan warna utama sistem dari biru -> merah jenama
 *
 * PENTING: Letak fail 'logo-juara.png' dalam folder public SEBELUM deploy.
 *          (Fail latar telus supaya kemas atas latar gelap.)
 */

import fs from "fs";

const LOGO = "logo-juara.png";           // nama fail logo dalam public
const RED = "#c8102e";                    // merah jenama (dari logo)
const RED_DARK = "#a00d24";               // merah gelap (hover)
const RED_RGB = "200,16,46";              // untuk rgba()

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
  if(!src) die("Beri nama fail. Contoh: node apply_branding.mjs public\\index.html");
  if(!fs.existsSync(src)) die(`Fail '${src}' tak wujud.`);
  let html = fs.readFileSync(src,"utf8");

  if(!html.includes('id="splash"')) die("Fail belum ada skrin splash. Jalankan penampal splash dulu.");
  if(html.includes("logo-juara.png")) die("Fail ini nampaknya SUDAH ada logo jenama.");

  // ========== A) TUKAR WARNA BIRU -> MERAH ==========
  // Warna jenama utama (butang, nav aktif, pautan, dsb)
  html = replaceAll(html, "#2563eb", RED);
  html = replaceAll(html, "#1d4ed8", RED_DARK);
  html = replaceAll(html, "rgba(37,99,235,", "rgba("+RED_RGB+",");
  // Gradient login/splash: biru gelap -> merah gelap berjenama
  html = replaceAll(html,
    "linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)",
    "linear-gradient(135deg,#1a0507 0%,#7a0f1a 100%)");

  // ========== B) LOGO SPLASH ==========
  // Ganti kotak biru + pesawat + tajuk dengan logo sebenar
  const splashOld = `  <div style="width:56px;height:56px;background:${RED};border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;box-shadow:0 8px 24px rgba(${RED_RGB},0.4)">
    <svg viewBox="0 0 24 24" style="width:30px;height:30px;fill:#fff"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
  </div>
  <div style="color:#f8fafc;font-size:18px;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px">Juara Travel</div>
  <div style="color:#94a3b8;font-size:12px;margin-bottom:22px">CRM System</div>`;
  const splashNew = `  <img src="${LOGO}" alt="Juara Travel" style="width:220px;max-width:70vw;margin-bottom:8px">
  <div style="color:#f8b4bd;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;margin-bottom:22px">CRM System</div>`;
  html = replaceOnce(html, splashOld, splashNew, "splash logo");

  // ========== C) LOGO LOGIN ==========
  const loginOld = `    <div class="l-logo">
      <div class="l-mark"><svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg></div>
      <div class="l-brand">Juara Travel</div>
      <div class="l-sub">CRM — Sales Management System</div>
    </div>`;
  const loginNew = `    <div class="l-logo">
      <img src="${LOGO}" alt="Juara Travel" style="width:200px;max-width:80%;margin:0 auto 6px;display:block">
      <div class="l-sub">CRM — Sales Management System</div>
    </div>`;
  html = replaceOnce(html, loginOld, loginNew, "login logo");

  // ========== D) LOGO SIDEBAR ==========
  const sideOld = `    <div class="s-brand">
      <div class="s-brandmark"><svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg></div>
      <div class="s-brand-name">Juara Travel</div>
      <div class="s-brand-sub">CRM System</div>
    </div>`;
  const sideNew = `    <div class="s-brand">
      <img src="${LOGO}" alt="Juara Travel" style="width:150px;max-width:90%;display:block;margin-bottom:4px">
      <div class="s-brand-sub">CRM System</div>
    </div>`;
  html = replaceOnce(html, sideOld, sideNew, "sidebar logo");

  fs.writeFileSync("index.html", html, "utf8");
  console.log("\n✅ SIAP! Logo + warna jenama merah ditambah: index.html");
  console.log("\n⚠️  WAJIB sebelum deploy: letak fail logo (latar telus) di public\\"+LOGO);
  console.log("\nLangkah seterusnya:");
  console.log("  1. Pastikan public\\"+LOGO+" wujud.");
  console.log("  2. move /Y index.html public\\index.html");
  console.log("  3. firebase deploy --only hosting");
  console.log("  4. Ctrl+Shift+R.\n");
}
main();

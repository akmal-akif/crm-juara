#!/usr/bin/env node
/*
 * Juara Travel CRM — Skrin Loading (Splash) berjenama
 * ====================================================
 * Jalankan pada fail yang SUDAH ada Login Google (Fasa 1) dan seterusnya.
 *
 * CARA GUNA:
 *     node apply_splash.mjs public\index.html
 *
 * Apa ia buat:
 *   - Papar skrin splash (logo + spinner) semasa Firebase semak status login.
 *   - Elak kelipan skrin login bila refresh.
 *   - Selepas siap semak: terus ke sistem (jika login) atau skrin login.
 */

import fs from "fs";

function die(m){ console.error("\nRALAT: "+m+"\n"); process.exit(1); }
function replaceOnce(text, oldStr, newStr, label){
  const i = text.indexOf(oldStr);
  if(i===-1) die(`Tak jumpa '${label}'.`);
  if(text.indexOf(oldStr, i+1)!==-1) die(`'${label}' dijumpai lebih sekali — tak selamat.`);
  return text.slice(0,i)+newStr+text.slice(i+oldStr.length);
}

function main(){
  const src = process.argv[2];
  if(!src) die("Beri nama fail. Contoh: node apply_splash.mjs public\\index.html");
  if(!fs.existsSync(src)) die(`Fail '${src}' tak wujud.`);
  let html = fs.readFileSync(src,"utf8");

  if(!html.includes("loginGoogle")) die("Fail belum ada Login Google. Jalankan Fasa 1 dulu.");
  if(html.includes('id="splash"')) die("Fail ini nampaknya SUDAH ada skrin splash.");

  // 1) Tambah splash HTML + sorok #lp pada mula (splash cover dulu)
  html = replaceOnce(html,
    `<!-- LOGIN -->\n<div id="lp">`,
    `<!-- SPLASH -->
<div id="splash" style="position:fixed;inset:0;z-index:1000;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)">
  <div style="width:56px;height:56px;background:#2563eb;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;box-shadow:0 8px 24px rgba(37,99,235,0.4)">
    <svg viewBox="0 0 24 24" style="width:30px;height:30px;fill:#fff"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
  </div>
  <div style="color:#f8fafc;font-size:18px;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px">Juara Travel</div>
  <div style="color:#94a3b8;font-size:12px;margin-bottom:22px">CRM System</div>
  <div style="width:26px;height:26px;border:3px solid rgba(255,255,255,0.2);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite"></div>
</div>
<!-- LOGIN -->
<div id="lp" style="display:none">`,
    "splash html");

  // 2) Fungsi showLoginScreen (sorok splash, papar login)
  html = replaceOnce(html,
    "onAuthStateChanged(auth, async (fbUser)=>{",
    "function showLoginScreen(){ const s=document.getElementById('splash'); if(s)s.style.display='none'; const lp=document.getElementById('lp'); if(lp)lp.style.display='flex'; const ap=document.getElementById('app'); if(ap)ap.style.display='none'; }\n" +
    "onAuthStateChanged(auth, async (fbUser)=>{",
    "showLoginScreen fn");

  // 3) doLoginUI: sorok splash bila masuk sistem
  html = replaceOnce(html,
    "function doLoginUI(user){\n  document.getElementById('lp').style.display='none';\n  document.getElementById('app').style.display='flex';",
    "function doLoginUI(user){\n  document.getElementById('lp').style.display='none';\n  document.getElementById('app').style.display='flex';\n  var _sp=document.getElementById('splash'); if(_sp)_sp.style.display='none';",
    "doLoginUI hide splash");

  // 4) null branch: guna showLoginScreen
  html = replaceOnce(html,
    "    document.getElementById('lp').style.display='flex';\n    document.getElementById('app').style.display='none';",
    "    showLoginScreen();",
    "null branch showLoginScreen");

  // 5) no-doc (minta akses): papar login dulu
  html = replaceOnce(html,
    "      pendingAuthUser={email,uid,name:fbUser.displayName||email};\n      showRequestAccess(email);",
    "      pendingAuthUser={email,uid,name:fbUser.displayName||email};\n      showLoginScreen();\n      showRequestAccess(email);",
    "no-doc showLoginScreen");

  // 6) pending / inactive / error: papar login dulu
  html = replaceOnce(html,
    "showLoginMessage('Menunggu kelulusan','Permintaan akses awak sedang menunggu kelulusan admin.','warn');",
    "showLoginScreen();showLoginMessage('Menunggu kelulusan','Permintaan akses awak sedang menunggu kelulusan admin.','warn');",
    "pending showLoginScreen");
  html = replaceOnce(html,
    "showLoginMessage('Akses dinyahaktifkan','Akaun awak telah dinyahaktifkan oleh admin.','error');",
    "showLoginScreen();showLoginMessage('Akses dinyahaktifkan','Akaun awak telah dinyahaktifkan oleh admin.','error');",
    "inactive showLoginScreen");
  html = replaceOnce(html,
    "showLoginMessage('Ralat','Gagal sahkan akses: '+e.message,'error');",
    "showLoginScreen();showLoginMessage('Ralat','Gagal sahkan akses: '+e.message,'error');",
    "error showLoginScreen");

  fs.writeFileSync("index.html", html, "utf8");
  console.log("\n✅ SIAP! Skrin loading (splash) ditambah: index.html");
  console.log("\nLangkah seterusnya:");
  console.log("  1. move /Y index.html public\\index.html   (CMD)   ATAU   move -Force ... (PowerShell)");
  console.log("  2. firebase deploy --only hosting");
  console.log("  3. Ctrl+Shift+R, refresh beberapa kali untuk lihat splash.\n");
}
main();

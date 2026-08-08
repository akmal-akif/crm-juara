#!/usr/bin/env node
/*
 * Juara Travel CRM — Penampal "Minta Akses" (self-service registration)
 * =====================================================================
 * Jalankan pada fail yang SUDAH ada Login Google + 3 Level (Fasa 1 & 2).
 *
 * CARA GUNA:
 *     node apply_request_access.mjs public\index.html
 *
 * Selepas ni:
 *   - User baru login Google -> nampak butang "Minta Akses"
 *   - Klik -> permintaan masuk ke Urus Pengguna (status: Menunggu)
 *   - Super Admin klik "Luluskan" -> user jadi Agent aktif
 */

import fs from "fs";

function die(m){ console.error("\nRALAT: "+m+"\n"); process.exit(1); }
function replaceOnce(text, oldStr, newStr, label){
  const i = text.indexOf(oldStr);
  if(i===-1) die(`Tak jumpa '${label}'. Pastikan fail SUDAH ada Login Google + 3 Level.`);
  if(text.indexOf(oldStr, i+1)!==-1) die(`'${label}' dijumpai lebih sekali — tak selamat.`);
  return text.slice(0,i)+newStr+text.slice(i+oldStr.length);
}

function main(){
  const src = process.argv[2];
  if(!src) die("Beri nama fail. Contoh: node apply_request_access.mjs public\\index.html");
  if(!fs.existsSync(src)) die(`Fail '${src}' tak wujud.`);
  let html = fs.readFileSync(src,"utf8");

  if(!html.includes("loginGoogle")) die("Fail belum ada Login Google (Fasa 1).");
  if(!html.includes("_isSuper=_role==='superadmin'")) die("Fail belum ada sistem 3 level (Fasa 2). Jalankan Fasa 2 dulu.");
  if(html.includes("function requestAccess()")) die("Fail ini nampaknya SUDAH ada Minta Akses.");

  // ---- 1) Global pendingAuthUser ----
  html = replaceOnce(html, "let allUsers=[];", "let allUsers=[];\nlet pendingAuthUser=null;", "global pendingAuthUser");

  // ---- 2) Blok 'tiada doc' -> papar butang Minta Akses (jangan signOut) ----
  html = replaceOnce(html,
`    if(!snap.exists()){
      showLoginMessage('Menunggu kelulusan','Email '+email+' belum diluluskan. Sila hubungi admin untuk diberi akses.','warn');
      await signOut(auth); return;
    }`,
`    if(!snap.exists()){
      pendingAuthUser={email,uid,name:fbUser.displayName||email};
      showRequestAccess(email);
      return;
    }`,
    "no-doc request access");

  // ---- 3) Tambah pengendalian status 'pending' ----
  html = replaceOnce(html,
`    const u=snap.data();
    if(u.status==='inactive'){
      showLoginMessage('Akses dinyahaktifkan','Akaun awak telah dinyahaktifkan oleh admin.','error');
      await signOut(auth); return;
    }`,
`    const u=snap.data();
    if(u.status==='pending'){
      showLoginMessage('Menunggu kelulusan','Permintaan akses awak sedang menunggu kelulusan admin.','warn');
      await signOut(auth); return;
    }
    if(u.status==='inactive'){
      showLoginMessage('Akses dinyahaktifkan','Akaun awak telah dinyahaktifkan oleh admin.','error');
      await signOut(auth); return;
    }`,
    "pending status handling");

  // ---- 4) Fungsi showRequestAccess + requestAccess ----
  const REQ_FUNCS = `
function showRequestAccess(email){
  const box=document.getElementById('l-status'); if(!box)return;
  box.style.display='block'; box.style.background='#fffbeb'; box.style.borderColor='#fde68a'; box.style.color='#92400e';
  box.innerHTML='<div style="font-weight:700;font-size:13px;margin-bottom:4px">Email belum diluluskan</div>'
    +'<div style="font-size:12px;margin-bottom:10px;line-height:1.5">'+email+' belum ada akses ke sistem. Hantar permintaan kepada admin untuk diluluskan?</div>'
    +'<button onclick="requestAccess()" style="width:100%;padding:9px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer">Minta Akses</button>';
}
async function requestAccess(){
  if(!pendingAuthUser)return;
  const box=document.getElementById('l-status');
  try{
    await setDoc(doc(db,'juara_users',pendingAuthUser.email),{email:pendingAuthUser.email,name:pendingAuthUser.name,role:'agent',status:'pending',uid:pendingAuthUser.uid,requestedAt:new Date().toISOString()});
    if(box){box.style.background='#f0fdf4';box.style.borderColor='#bbf7d0';box.style.color='#15803d';box.innerHTML='<div style="font-weight:700;font-size:13px;margin-bottom:2px">Permintaan dihantar &#10003;</div><div style="font-size:12px;line-height:1.5">Admin akan luluskan tak lama lagi. Sila log masuk semula selepas diluluskan.</div>';}
  }catch(e){
    if(box){box.style.background='#fef2f2';box.style.borderColor='#fecaca';box.style.color='#b91c1c';box.innerHTML='<div style="font-weight:700;font-size:13px;margin-bottom:2px">Gagal hantar permintaan</div><div style="font-size:12px">'+e.message+'</div>';}
  }
  try{await signOut(auth);}catch(_){}
  pendingAuthUser=null;
}
`;
  html = replaceOnce(html, "function subscribeUsers(){", REQ_FUNCS + "\nfunction subscribeUsers(){", "request funcs");

  // ---- 5) Daftar window.requestAccess ----
  html = replaceOnce(html,
    "window.deleteUser=deleteUser; window.setUserRole=setUserRole;",
    "window.deleteUser=deleteUser; window.setUserRole=setUserRole; window.requestAccess=requestAccess;",
    "window requestAccess");

  // ---- 6) renderUsers: status pill 'Menunggu' untuk pending ----
  html = replaceOnce(html,
    `const statusPill=u.status==='inactive'?'<span class="pill pl">Nyahaktif</span>':'<span class="pill pcl">Aktif</span>';`,
    `const statusPill=u.status==='pending'?'<span class="pill pq">Menunggu</span>':(u.status==='inactive'?'<span class="pill pl">Nyahaktif</span>':'<span class="pill pcl">Aktif</span>');`,
    "renderUsers pending pill");

  // ---- 7) renderUsers: label butang -> 'Luluskan' untuk pending ----
  html = replaceOnce(html,
    `(u.status==='inactive'?'Aktifkan':'Nyahaktif')`,
    `(u.status==='pending'?'Luluskan':(u.status==='inactive'?'Aktifkan':'Nyahaktif'))`,
    "renderUsers approve label");

  // ---- 8) toggleUserStatus: pending/inactive -> active, active -> inactive ----
  html = replaceOnce(html,
    `const next=u.status==='inactive'?'active':'inactive';`,
    `const next=(u.status==='active')?'inactive':'active';`,
    "toggleUserStatus logic");

  fs.writeFileSync("index.html", html, "utf8");
  console.log("\n✅ SIAP! Minta Akses ditambah: index.html");
  console.log("\nLangkah seterusnya:");
  console.log("  1. move -Force index.html public\\index.html");
  console.log("  2. firebase deploy --only hosting");
  console.log("  3. Uji: minta seorang login guna email BARU -> klik 'Minta Akses'.");
  console.log("  4. Awak (Super Admin) buka Urus Pengguna -> klik 'Luluskan'.");
  console.log("  5. GUNA firestore rules versi 'request' bila deploy rules nanti.\n");
}
main();

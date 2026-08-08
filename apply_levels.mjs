#!/usr/bin/env node
/*
 * Juara Travel CRM — Penampal Fasa 2: Level Super Admin / Admin / Agent
 * =====================================================================
 * Jalankan pada fail yang SUDAH ada login Google (Fasa 1).
 *
 * CARA GUNA:
 *     node apply_levels.mjs public\index.html
 *
 * Hasil:  index.html  (versi baru dengan 3 level)
 *
 * Model:
 *   superadmin — akses penuh (urus pengguna, settings, padam data)
 *   admin      — urus operasi (lead/pakej/kempen/laporan) TANPA padam/settings/pengguna
 *   agent      — lead sendiri sahaja
 */

import fs from "fs";

function die(m){ console.error("\nRALAT: "+m+"\n"); process.exit(1); }

function replaceOnce(text, oldStr, newStr, label){
  const i = text.indexOf(oldStr);
  if(i===-1) die(`Tak jumpa '${label}'. Pastikan awak jalankan pada fail yang SUDAH ada Login Google (Fasa 1).`);
  if(text.indexOf(oldStr, i+1)!==-1) die(`'${label}' dijumpai lebih sekali — tak selamat.`);
  return text.slice(0,i)+newStr+text.slice(i+oldStr.length);
}
function replaceAll(text, oldStr, newStr){
  return text.split(oldStr).join(newStr);
}

function main(){
  const src = process.argv[2];
  if(!src) die("Beri nama fail. Contoh: node apply_levels.mjs public\\index.html");
  if(!fs.existsSync(src)) die(`Fail '${src}' tak wujud.`);
  let html = fs.readFileSync(src,"utf8");

  if(!html.includes("loginGoogle") || !html.includes("BOOTSTRAP_ADMIN_EMAIL")){
    die("Fail ini belum ada Login Google (Fasa 1). Jalankan Fasa 1 dulu.");
  }
  if(html.includes("_isSuper=_role==='superadmin'")){
    die("Fail ini nampaknya SUDAH ada sistem level. Jalankan pada fail Fasa 1 sahaja.");
  }

  // ---- 1) doLoginUI: badge + visibility ikut role ----
  html = replaceOnce(html,
`  document.getElementById('u-role').textContent=user.role==='admin'?'Administrator':'Sales Agent';
  const rb=document.getElementById('role-badge');
  rb.textContent=user.role==='admin'?'Admin':'Agent: '+(user.name||'');
  rb.className='tb-badge '+(user.role==='admin'?'ba':'bg');
  const showAdmin=user.role==='admin';
  ['nav-assign','nav-set','nav-users'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display=showAdmin?'flex':'none';});`,
`  const _role=user.role;
  const _isSuper=_role==='superadmin';
  const _isMgr=_role==='superadmin'||_role==='admin';
  document.getElementById('u-role').textContent=_isSuper?'Super Admin':(_role==='admin'?'Administrator':'Sales Agent');
  const rb=document.getElementById('role-badge');
  rb.textContent=_isSuper?'Super Admin':(_role==='admin'?'Admin':'Agent: '+(user.name||''));
  rb.className='tb-badge '+(_isMgr?'ba':'bg');
  const _vis=(id,show)=>{const el=document.getElementById(id);if(el)el.style.display=show?'flex':'none';};
  _vis('nav-assign',_isMgr);
  _vis('nav-users',_isSuper);
  _vis('nav-set',_isSuper);
  _vis('nav-pipeline',_isMgr);
  _vis('nav-team',_isMgr);
  _vis('nav-campaigns',_isMgr);
  _vis('nav-report',_isMgr);`,
    "doLoginUI visibility");

  // ---- 2) Bootstrap: cipta/naik-taraf kepada superadmin ----
  html = replaceOnce(html,
`    if(!snap.exists() && BOOTSTRAP_ADMIN_EMAIL && email===await normEmail(BOOTSTRAP_ADMIN_EMAIL)){
      await setDoc(uref,{email,name:fbUser.displayName||'Admin',role:'admin',status:'active',uid,createdAt:new Date().toISOString(),bootstrap:true});
      snap=await getDoc(uref);
    }`,
`    if(!snap.exists() && BOOTSTRAP_ADMIN_EMAIL && email===await normEmail(BOOTSTRAP_ADMIN_EMAIL)){
      await setDoc(uref,{email,name:fbUser.displayName||'Admin',role:'superadmin',status:'active',uid,createdAt:new Date().toISOString(),bootstrap:true});
      snap=await getDoc(uref);
    } else if(snap.exists() && BOOTSTRAP_ADMIN_EMAIL && email===await normEmail(BOOTSTRAP_ADMIN_EMAIL) && snap.data().role!=='superadmin'){
      try{await updateDoc(uref,{role:'superadmin'});}catch(_){}
      snap=await getDoc(uref);
    }`,
    "bootstrap superadmin");

  // ---- 3) Urus Pengguna: hanya superadmin (semua guard) ----
  html = replaceAll(html, "if(!CU||CU.role!=='admin')", "if(!CU||CU.role!=='superadmin')");

  // ---- 4) renderUsers: tambah pilihan Super Admin dalam dropdown ----
  html = replaceOnce(html,
    `>Admin</option></select></td>'`,
    `>Admin</option><option value="superadmin" '+(u.role==='superadmin'?'selected':'')+'>Super Admin</option></select></td>'`,
    "renderUsers role option");

  // ---- 5) Modal luluskan pengguna: tambah pilihan Super Admin + perincikan teks ----
  html = replaceOnce(html,
    `<select class="fi" id="us-role"><option value="agent">Agent (nampak lead sendiri)</option><option value="admin">Admin (akses penuh)</option></select>`,
    `<select class="fi" id="us-role"><option value="agent">Agent (lead sendiri sahaja)</option><option value="admin">Admin (urus operasi, tanpa padam/settings)</option><option value="superadmin">Super Admin (akses penuh)</option></select>`,
    "us-role modal option");

  // ---- 6) Sidebar: tambah id pada Pipeline/Team/Campaigns/Report (untuk sembunyi dari agent) ----
  html = replaceOnce(html,
    `<div class="s-item" onclick="nav('pipeline',this)">`,
    `<div class="s-item" id="nav-pipeline" onclick="nav('pipeline',this)">`,
    "sidebar pipeline id");
  html = replaceOnce(html,
    `<div class="s-item" onclick="nav('team',this)">`,
    `<div class="s-item" id="nav-team" onclick="nav('team',this)">`,
    "sidebar team id");
  html = replaceOnce(html,
    `<div class="s-item" onclick="nav('campaigns',this)">`,
    `<div class="s-item" id="nav-campaigns" onclick="nav('campaigns',this)">`,
    "sidebar campaigns id");
  html = replaceOnce(html,
    `<div class="s-item" onclick="nav('report',this)">`,
    `<div class="s-item" id="nav-report" onclick="nav('report',this)">`,
    "sidebar report id");

  // ---- 7) renderLeadsEl: Edit = manager, Padam = superadmin ----
  html = replaceOnce(html,
`  const isAdmin=CU&&CU.role==='admin';
  const rows=data.map((l,idx)=>`,
`  const isManager=CU&&(CU.role==='admin'||CU.role==='superadmin');
  const isSuper=CU&&CU.role==='superadmin';
  const isAdmin=isManager;
  const rows=data.map((l,idx)=>`,
    "renderLeadsEl roles");
  // Butang Padam lead -> guna isSuper
  html = replaceOnce(html,
    "${isAdmin?`<button onclick=\"deleteLead",
    "${isSuper?`<button onclick=\"deleteLead",
    "delete lead -> superadmin");

  // ---- 8) renderCampaigns: Padam kempen = superadmin ----
  html = replaceOnce(html,
`  const isAdmin=CU&&CU.role==='admin';
  if(!allCamps.length){`,
`  const isAdmin=CU&&CU.role==='superadmin';
  if(!allCamps.length){`,
    "renderCampaigns delete -> superadmin");

  // ---- 9) renderFollowup: pemilih agent untuk manager (admin+superadmin) ----
  html = replaceOnce(html,
`  const isAdmin=CU&&CU.role==='admin';
  let leads=allLeads.filter(l=>l.status==='Contacted');`,
`  const isAdmin=CU&&(CU.role==='admin'||CU.role==='superadmin');
  let leads=allLeads.filter(l=>l.status==='Contacted');`,
    "renderFollowup manager");

  // ---- 10) Guard fungsi padam & settings (pertahanan lapis kedua) ----
  html = replaceOnce(html,
    "async function deleteLead(docId,name){if(!confirm(",
    "async function deleteLead(docId,name){if(!CU||CU.role!=='superadmin'){toast('Hanya Super Admin boleh padam lead.',true);return;}if(!confirm(",
    "guard deleteLead");
  html = replaceOnce(html,
    "async function deleteCampaign(docId,name){\n  if(!confirm(",
    "async function deleteCampaign(docId,name){\n  if(!CU||CU.role!=='superadmin'){toast('Hanya Super Admin boleh padam kempen.',true);return;}\n  if(!confirm(",
    "guard deleteCampaign");
  html = replaceOnce(html,
    "async function deletePkg(docId){const p=allPkgs.find(",
    "async function deletePkg(docId){if(!CU||CU.role!=='superadmin'){toast('Hanya Super Admin boleh padam pakej.',true);return;}const p=allPkgs.find(",
    "guard deletePkg");
  html = replaceOnce(html,
    "async function saveSettings(){TARGET.pax=",
    "async function saveSettings(){if(!CU||CU.role!=='superadmin'){toast('Hanya Super Admin boleh ubah settings.',true);return;}TARGET.pax=",
    "guard saveSettings");

  // ---- 11) Sembunyi butang Padam pakej dalam Agent&Pakej (superadmin sahaja) ----
  html = replaceOnce(html,
    `<button onclick="deletePkg('\${p._id}')" style="font-size:11px;padding:4px 10px;border:1px solid #fecaca;border-radius:4px;background:#fee2e2;cursor:pointer;color:#991b1b;font-weight:500">🗑 Padam</button>`,
    "${(CU&&CU.role==='superadmin')?`<button onclick=\"deletePkg('${p._id}')\" style=\"font-size:11px;padding:4px 10px;border:1px solid #fecaca;border-radius:4px;background:#fee2e2;cursor:pointer;color:#991b1b;font-weight:500\">🗑 Padam</button>`:''}",
    "hide delete pkg button");

  fs.writeFileSync("index.html", html, "utf8");
  console.log("\n✅ SIAP! Sistem 3 level ditambah: index.html");
  console.log("\nLangkah seterusnya:");
  console.log("  1. move -Force index.html public\\index.html");
  console.log("  2. firebase deploy --only hosting");
  console.log("  3. Login semula — awak akan dinaikkan auto ke Super Admin.");
  console.log("  4. SELEPAS sahkan Super Admin berfungsi, baru deploy firestore.rules.\n");
}
main();

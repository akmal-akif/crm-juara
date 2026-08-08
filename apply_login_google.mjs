#!/usr/bin/env node
/*
 * Juara Travel CRM — Penampal automatik Login Google (Fasa 1) — versi Node.js
 * ===========================================================================
 * Mengambil fail CRM ASAL awak dan menghasilkan fail baru yang sudah lengkap
 * dengan Login Google + role + Urus Pengguna. Fail asal TIDAK diubah.
 *
 * CARA GUNA (dalam terminal):
 *     node apply_login_google.mjs public\index.html
 *
 * Ia hasilkan:  index.html  (dalam folder semasa)
 *
 * PENTING: Isi email admin awak di bawah (baris ADMIN_EMAIL) sebelum jalankan.
 */

import fs from "fs";

// ============================================================
// ISI EMAIL GOOGLE AWAK DI SINI (admin pertama)
// ============================================================
const ADMIN_EMAIL = "akmalakif5315@gmail.com";   // <-- email admin
// ============================================================

function die(msg) {
  console.error("\nRALAT: " + msg + "\n");
  process.exit(1);
}

function mustReplace(text, oldStr, newStr, label) {
  const idx = text.indexOf(oldStr);
  if (idx === -1) die(`Tak jumpa bahagian untuk '${label}'. Fail mungkin sudah diubah atau bukan fail asal.`);
  if (text.indexOf(oldStr, idx + 1) !== -1) die(`Corak '${label}' dijumpai lebih dari sekali — tak selamat untuk ganti automatik.`);
  return text.slice(0, idx) + newStr + text.slice(idx + oldStr.length);
}

function mustInsertBefore(text, anchor, insert, label) {
  const idx = text.indexOf(anchor);
  if (idx === -1) die(`Tak jumpa penanda untuk '${label}'.`);
  return text.slice(0, idx) + insert + text.slice(idx);
}

function main() {
  const src = process.argv[2];
  if (!src) die("Sila beri nama fail asal. Contoh: node apply_login_google.mjs public\\index.html");
  if (!fs.existsSync(src)) die(`Fail '${src}' tak wujud.`);
  if (ADMIN_EMAIL === "emailanda@gmail.com") {
    die("Awak belum tukar ADMIN_EMAIL dalam skrip ini.");
  }

  let html = fs.readFileSync(src, "utf8");

  if (html.includes("loginGoogle") || html.includes("BOOTSTRAP_ADMIN_EMAIL")) {
    die("Fail ini nampaknya SUDAH ditampal. Jalankan pada fail ASAL sahaja.");
  }

  // ---- B) Import modul Auth ----
  html = mustReplace(
    html,
    'import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";',
    'import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";\n' +
    'import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";',
    "import Auth"
  );

  // ---- C) Init auth + bootstrap admin ----
  html = mustReplace(
    html,
    "const fbApp=initializeApp(fbCfg);\nconst db=getFirestore(fbApp);",
    "const fbApp=initializeApp(fbCfg);\n" +
    "const db=getFirestore(fbApp);\n" +
    "const auth=getAuth(fbApp);\n" +
    "const googleProvider=new GoogleAuthProvider();\n" +
    `const BOOTSTRAP_ADMIN_EMAIL = ${JSON.stringify(ADMIN_EMAIL)};`,
    "init auth"
  );

  // ---- D1) Buang senarai password hardcoded ----
  const usersMatch = html.match(/const USERS=\[[\s\S]*?\];/);
  if (!usersMatch) die("Tak jumpa senarai USERS untuk dibuang.");
  html = html.replace(usersMatch[0], "// (USERS hardcoded telah dibuang — login kini melalui Firebase Auth Google)");

  // ---- Tambah pemboleh ubah global juara_users ----
  html = mustReplace(
    html,
    "let unsubAgents=null,unsubL=null,unsubC=null,unsubP=null,unsubA=null,unsubH=null;",
    "let unsubAgents=null,unsubL=null,unsubC=null,unsubP=null,unsubA=null,unsubH=null,unsubU=null;\n" +
    "let allUsers=[];",
    "global vars users"
  );

  // ---- D2) Buang login/doLoginUI/autoLogin/logout lama ----
  function removeFn(re, label) {
    const m = html.match(re);
    if (!m) die(`Tak jumpa fungsi ${label} lama.`);
    html = html.replace(m[0], "");
  }
  removeFn(/function login\(\)\{[\s\S]*?\n\}\n/, "login()");
  removeFn(/function doLoginUI\(f\)\{[\s\S]*?\n\}\n/, "doLoginUI()");
  removeFn(/function autoLogin\(\)\{[\s\S]*?\n\}\n/, "autoLogin()");
  removeFn(/function logout\(\)\{[\s\S]*?\n\}\n/, "logout()");

  const NEW_AUTH = `
async function normEmail(e){return (e||'').trim().toLowerCase();}
async function loginGoogle(){
  const errEl=document.getElementById('lerr');
  if(errEl)errEl.style.display='none';
  const statusEl=document.getElementById('l-status');
  if(statusEl)statusEl.style.display='none';
  try{ await signInWithPopup(auth,googleProvider); }
  catch(e){
    if(e.code==='auth/popup-closed-by-user')return;
    if(errEl){errEl.textContent='Gagal log masuk: '+(e.code||e.message);errEl.style.display='block';}
  }
}
function showLoginMessage(title,sub,tone){
  const box=document.getElementById('l-status'); if(!box)return;
  const col=tone==='error'?'#b91c1c':tone==='warn'?'#92400e':'#15803d';
  const bg=tone==='error'?'#fef2f2':tone==='warn'?'#fffbeb':'#f0fdf4';
  const bd=tone==='error'?'#fecaca':tone==='warn'?'#fde68a':'#bbf7d0';
  box.style.display='block'; box.style.background=bg; box.style.borderColor=bd; box.style.color=col;
  box.innerHTML='<div style="font-weight:700;font-size:13px;margin-bottom:2px">'+title+'</div><div style="font-size:12px;opacity:.85">'+sub+'</div>';
}
function doLoginUI(user){
  document.getElementById('lp').style.display='none';
  document.getElementById('app').style.display='flex';
  document.getElementById('u-av').textContent=(user.name||'?')[0];
  document.getElementById('u-name').textContent=user.name||user.email;
  document.getElementById('u-role').textContent=user.role==='admin'?'Administrator':'Sales Agent';
  const rb=document.getElementById('role-badge');
  rb.textContent=user.role==='admin'?'Admin':'Agent: '+(user.name||'');
  rb.className='tb-badge '+(user.role==='admin'?'ba':'bg');
  const showAdmin=user.role==='admin';
  ['nav-assign','nav-set','nav-users'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display=showAdmin?'flex':'none';});
}
onAuthStateChanged(auth, async (fbUser)=>{
  if(!fbUser){
    CU=null;
    if(unsubL)unsubL(); if(unsubC)unsubC(); if(unsubP)unsubP(); if(unsubA)unsubA(); if(unsubAgents)unsubAgents(); if(unsubH)unsubH(); if(unsubU)unsubU();
    allLeads=[];allCamps=[];allPkgs=[];pkgAssign={};destroyCharts();
    document.getElementById('lp').style.display='flex';
    document.getElementById('app').style.display='none';
    return;
  }
  const email=await normEmail(fbUser.email);
  const uid=fbUser.uid;
  try{
    const uref=doc(db,'juara_users',email);
    let snap=await getDoc(uref);
    if(!snap.exists() && BOOTSTRAP_ADMIN_EMAIL && email===await normEmail(BOOTSTRAP_ADMIN_EMAIL)){
      await setDoc(uref,{email,name:fbUser.displayName||'Admin',role:'admin',status:'active',uid,createdAt:new Date().toISOString(),bootstrap:true});
      snap=await getDoc(uref);
    }
    if(!snap.exists()){
      showLoginMessage('Menunggu kelulusan','Email '+email+' belum diluluskan. Sila hubungi admin untuk diberi akses.','warn');
      await signOut(auth); return;
    }
    const u=snap.data();
    if(u.status==='inactive'){
      showLoginMessage('Akses dinyahaktifkan','Akaun awak telah dinyahaktifkan oleh admin.','error');
      await signOut(auth); return;
    }
    if(!u.uid || u.uid!==uid){ try{await updateDoc(uref,{uid,lastLogin:new Date().toISOString()});}catch(_){} }
    else { try{await updateDoc(uref,{lastLogin:new Date().toISOString()});}catch(_){} }
    CU={email:u.email,name:u.name,role:u.role,uid};
    const nowMY=new Date(new Date().getTime()+8*60*60*1000);
    document.getElementById('f-mo').value=nowMY.getMonth();
    document.getElementById('f-yr').value=nowMY.getFullYear();
    doLoginUI(CU); subscribe(); generateScript();
  }catch(e){
    showLoginMessage('Ralat','Gagal sahkan akses: '+e.message,'error');
    try{await signOut(auth);}catch(_){}
  }
});
async function logout(){ try{await signOut(auth);}catch(_){} }
`;
  html = mustInsertBefore(html, "function subscribe(){", NEW_AUTH + "\n", "auth functions");

  // ---- D3) window.* ----
  html = mustReplace(
    html,
    "window.login=login; window.logout=logout; window.nav=nav; window.refresh=refresh;",
    "window.loginGoogle=loginGoogle; window.logout=logout; window.nav=nav; window.refresh=refresh;\n" +
    "window.openAddUser=openAddUser; window.saveUser=saveUser; window.toggleUserStatus=toggleUserStatus;\n" +
    "window.deleteUser=deleteUser; window.setUserRole=setUserRole;",
    "window registrations"
  );

  // ---- G) subscribe() langgan users ----
  html = mustReplace(
    html,
    "  unsubA=onSnapshot(doc(db,'juara_config','assignments'),snap=>{pkgAssign=snap.exists()?snap.data():{};});\n}",
    "  unsubA=onSnapshot(doc(db,'juara_config','assignments'),snap=>{pkgAssign=snap.exists()?snap.data():{};});\n" +
    "  subscribeUsers();\n}",
    "subscribe users call"
  );

  // ---- F4) Logik Urus Pengguna ----
  const USERS_LOGIC = `
function subscribeUsers(){
  if(unsubU)unsubU();
  unsubU=onSnapshot(collection(db,'juara_users'),s=>{
    allUsers=s.docs.map(d=>({...d.data(),_id:d.id}));
    allUsers.sort((a,b)=>(a.name||'').localeCompare(b.name||''));
    if(document.getElementById('page-users')&&document.getElementById('page-users').classList.contains('active'))renderUsers();
  });
}
function renderUsers(){
  const el=document.getElementById('users-tbl');if(!el)return;
  if(!CU||CU.role!=='admin'){el.innerHTML='<div class="empty"><div class="empty-title">Akses ditolak</div></div>';return;}
  if(!allUsers.length){el.innerHTML='<div class="empty"><div class="empty-title">Tiada pengguna</div><div class="empty-sub">Klik "+ Luluskan Pengguna"</div></div>';return;}
  const rows=allUsers.map(u=>{
    const isSelf=CU && u.email===CU.email;
    const statusPill=u.status==='inactive'?'<span class="pill pl">Nyahaktif</span>':'<span class="pill pcl">Aktif</span>';
    const last=u.lastLogin?getMYDateStr(u.lastLogin):'—';
    return '<tr>'
      +'<td style="font-weight:600">'+(u.name||'—')+(isSelf?' <span style="font-size:10px;color:var(--text2)">(anda)</span>':'')+'</td>'
      +'<td style="font-size:12px;color:var(--text2)">'+(u.email||'—')+'</td>'
      +'<td><select onchange="setUserRole(\\''+u._id+'\\',this.value)" '+(isSelf?'disabled title="Tak boleh tukar role sendiri"':'')+' style="font-size:12px;border:1px solid var(--border);border-radius:4px;padding:3px 6px;background:#fff;cursor:pointer;outline:none"><option value="agent" '+(u.role==='agent'?'selected':'')+'>Agent</option><option value="admin" '+(u.role==='admin'?'selected':'')+'>Admin</option></select></td>'
      +'<td>'+statusPill+'</td>'
      +'<td style="font-size:11px;color:var(--text2);white-space:nowrap">'+last+'</td>'
      +'<td style="white-space:nowrap">'+(isSelf?'':'<button onclick="toggleUserStatus(\\''+u._id+'\\')" style="font-size:11px;padding:3px 9px;border:1px solid var(--border);border-radius:4px;background:#fff;cursor:pointer;color:var(--text2);font-weight:500">'+(u.status==='inactive'?'Aktifkan':'Nyahaktif')+'</button> <button onclick="deleteUser(\\''+u._id+'\\',\\''+((u.name||'').replace(/'/g,"\\\\'"))+'\\')" style="font-size:11px;padding:3px 8px;border:1px solid #fecaca;border-radius:4px;background:#fee2e2;cursor:pointer;color:#991b1b;margin-left:3px;font-weight:500">Padam</button>')+'</td>'
      +'</tr>';
  }).join('');
  el.innerHTML='<table style="min-width:720px"><thead><tr><th>Nama</th><th>Email</th><th>Peranan</th><th>Status</th><th>Login Terakhir</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>';
}
function openAddUser(){
  if(!CU||CU.role!=='admin')return;
  document.getElementById('us-email').value='';
  document.getElementById('us-name').value='';
  document.getElementById('us-role').value='agent';
  const dl=document.getElementById('us-agent-names');
  if(dl)dl.innerHTML=(allAgents.length?allAgents.map(a=>a.name):ALL_AGENTS).map(n=>'<option value="'+n+'">').join('');
  document.getElementById('m-user').classList.add('open');
}
async function saveUser(){
  if(!CU||CU.role!=='admin'){toast('Hanya admin boleh urus pengguna.',true);return;}
  const email=(document.getElementById('us-email').value||'').trim().toLowerCase();
  const name=document.getElementById('us-name').value.trim();
  const role=document.getElementById('us-role').value;
  if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)){toast('Email tidak sah.',true);return;}
  if(!name){toast('Nama wajib diisi.',true);return;}
  try{
    await setDoc(doc(db,'juara_users',email),{email,name,role,status:'active',createdAt:new Date().toISOString(),approvedBy:CU.email},{merge:true});
    await logAudit('Luluskan pengguna: '+email+' ('+role+')');
    cm('m-user');toast('Pengguna diluluskan.');
  }catch(e){toast('Ralat: '+e.message,true);}
}
async function setUserRole(docId,role){
  if(!CU||CU.role!=='admin')return;
  if(docId===CU.email){toast('Tak boleh tukar peranan sendiri.',true);renderUsers();return;}
  try{await updateDoc(doc(db,'juara_users',docId),{role});await logAudit('Tukar peranan '+docId+' -> '+role);toast('Peranan dikemaskini.');}
  catch(e){toast('Ralat: '+e.message,true);}
}
async function toggleUserStatus(docId){
  if(!CU||CU.role!=='admin')return;
  const u=allUsers.find(x=>x._id===docId);if(!u)return;
  const next=u.status==='inactive'?'active':'inactive';
  try{await updateDoc(doc(db,'juara_users',docId),{status:next});await logAudit((next==='inactive'?'Nyahaktif':'Aktifkan')+' pengguna '+docId);toast('Status dikemaskini.');}
  catch(e){toast('Ralat: '+e.message,true);}
}
async function deleteUser(docId,name){
  if(!CU||CU.role!=='admin')return;
  if(!confirm('Padam akses untuk "'+name+'"? Mereka tak lagi boleh log masuk.'))return;
  try{await deleteDoc(doc(db,'juara_users',docId));await logAudit('Padam pengguna '+docId);toast('Pengguna dipadam.');}
  catch(e){toast('Ralat: '+e.message,true);}
}
async function logAudit(action){
  try{await addDoc(collection(db,'juara_audit'),{action,by:(CU&&CU.email)||'?',byName:(CU&&CU.name)||'?',at:new Date().toISOString()});}catch(_){}
}
`;
  html = mustInsertBefore(html, "function generateScript(){", USERS_LOGIC + "\n", "users logic");

  // ---- F5) Daftar halaman users ----
  html = mustReplace(
    html,
    "assign:'Agent & Pakej',campaigns:'Kempen Iklan'",
    "assign:'Agent & Pakej',users:'Urus Pengguna',campaigns:'Kempen Iklan'",
    "nav title users"
  );
  html = html.replace(
    "const F={leads:renderLeadsTable,pipeline:renderPipeline,team:renderTeam,aftersales:renderAfterSales,assign:renderAssign,campaigns:renderCampaigns,report:renderReport};",
    "const F={leads:renderLeadsTable,pipeline:renderPipeline,team:renderTeam,aftersales:renderAfterSales,assign:renderAssign,users:renderUsers,campaigns:renderCampaigns,report:renderReport};"
  );
  html = html.replace(
    "const F={dashboard:renderDashboard,leads:renderLeadsTable,pipeline:renderPipeline,team:renderTeam,aftersales:renderAfterSales,assign:renderAssign,campaigns:renderCampaigns,report:renderReport};",
    "const F={dashboard:renderDashboard,leads:renderLeadsTable,pipeline:renderPipeline,team:renderTeam,aftersales:renderAfterSales,assign:renderAssign,users:renderUsers,campaigns:renderCampaigns,report:renderReport};"
  );

  // ---- E) Skrin login butang Google ----
  const loginMatch = html.match(/<!-- LOGIN -->\s*<div id="lp">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
  if (!loginMatch) die("Tak jumpa skrin login lama untuk diganti.");
  const NEW_LOGIN = `<!-- LOGIN -->
<div id="lp">
  <div class="lc">
    <div class="l-logo">
      <div class="l-mark"><svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg></div>
      <div class="l-brand">Juara Travel</div>
      <div class="l-sub">CRM — Sales Management System</div>
    </div>
    <button class="l-btn" onclick="loginGoogle()" style="display:flex;align-items:center;justify-content:center;gap:10px;background:#fff;color:#1f2937;border:1px solid #e2e8f0">
      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
      Log Masuk dengan Google
    </button>
    <div class="l-err" id="lerr" style="display:none">Ralat log masuk.</div>
    <div id="l-status" style="display:none;margin-top:12px;padding:10px 12px;border:1px solid;border-radius:8px"></div>
    <div class="l-footer">© 2026 Juara Travel & Tours</div>
  </div>
</div>`;
  html = html.replace(loginMatch[0], NEW_LOGIN);

  // ---- F1) Item sidebar Urus Pengguna ----
  html = mustReplace(
    html,
    `<div class="s-item" id="nav-assign" style="display:none" onclick="nav('assign',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>Agent & Pakej</div>`,
    `<div class="s-item" id="nav-assign" style="display:none" onclick="nav('assign',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>Agent & Pakej</div>
      <div class="s-item" id="nav-users" style="display:none" onclick="nav('users',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Urus Pengguna</div>`,
    "sidebar users item"
  );

  // ---- F2) Halaman Urus Pengguna ----
  const USERS_PAGE = `      <!-- USERS -->
      <div class="page" id="page-users">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
          <div style="font-size:13px;color:var(--text2)">Luluskan email untuk beri akses. Agent hanya nampak lead mereka; admin nampak semua.</div>
          <button class="btn btn-p btn-sm" onclick="openAddUser()">+ Luluskan Pengguna</button>
        </div>
        <div class="card card-flush"><div class="tw" id="users-tbl"></div></div>
      </div>
`;
  html = mustInsertBefore(html, "      <!-- SETTINGS -->", USERS_PAGE, "users page");

  // ---- F3) Modal tambah pengguna ----
  const USER_MODAL = `<div class="ov" id="m-user">
  <div class="modal" style="width:420px">
    <div class="m-title">Luluskan Pengguna Baru</div>
    <div class="fg"><label class="fl">Email Google</label><input class="fi" id="us-email" placeholder="nama@gmail.com"></div>
    <div class="fg"><label class="fl">Nama Paparan</label>
      <input class="fi" id="us-name" placeholder="Contoh: Izzati" list="us-agent-names">
      <datalist id="us-agent-names"></datalist>
      <div style="font-size:11px;color:var(--text2);margin-top:4px">Untuk agent sedia ada, guna nama yang SAMA (cth: Izzati) supaya lead mereka terus terkait.</div>
    </div>
    <div class="fg"><label class="fl">Peranan</label>
      <select class="fi" id="us-role"><option value="agent">Agent (nampak lead sendiri)</option><option value="admin">Admin (akses penuh)</option></select>
    </div>
    <div class="mfoot"><button class="btn btn-s" onclick="cm('m-user')">Batal</button><button class="btn btn-p" onclick="saveUser()">Luluskan</button></div>
  </div>
</div>
`;
  html = mustInsertBefore(html, '<div class="toast" id="toast"></div>', USER_MODAL, "user modal");

  // ---- H) Hadkan butang Padam lead kepada admin ----
  const oldDel = `<button onclick="deleteLead('\${l._id}','\${(l.name||'').replace(/'/g,"\\\\'")}') " style="font-size:11px;padding:3px 8px;border:1px solid #fecaca;border-radius:4px;background:#fee2e2;cursor:pointer;color:#991b1b;margin-left:3px;font-weight:500">Padam</button>`;
  const newDel = "${isAdmin?`" + oldDel + "`:''}";
  if (html.includes(oldDel)) {
    html = html.replace(oldDel, newDel);
  } else {
    console.log("Nota: butang Padam lead tak dijumpai untuk dihadkan (format mungkin berbeza). Bahagian lain diteruskan.");
  }

  // ---- Buang panggilan autoLogin() ----
  html = html.replace("// ==== INIT ====\nautoLogin();", "// ==== INIT ====\n// (autoLogin dibuang — onAuthStateChanged kendalikan sesi automatik)");
  html = html.replace("autoLogin();\n", "");

  fs.writeFileSync("index.html", html, "utf8");

  console.log("\n✅ SIAP! Fail baru dihasilkan: index.html");
  console.log("   Admin pertama: " + ADMIN_EMAIL);
  console.log("\nLangkah seterusnya:");
  console.log("  1. Letak index.html ke dalam folder 'public'.");
  console.log("  2. Tambah URL .web.app baru ke Authorised domains (Firebase Console).");
  console.log("  3. firebase deploy");
  console.log("  4. Buka URL, login guna email admin di atas.\n");
}

main();

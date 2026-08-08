#!/usr/bin/env node
/*
 * Juara Travel CRM — Notifikasi Loceng + Bunyi 'ding' untuk lead baru
 * ====================================================================
 * Jalankan pada fail yang SUDAH ada Login Google + splash (fasa sebelum).
 *
 * CARA GUNA:
 *     node apply_notif.mjs public\index.html
 *
 * Kelakuan:
 *   - Loceng di topbar dengan nombor (badge) lead belum dibaca.
 *   - Bunyi 'ding' bila lead baru masuk / lead baru di-assign kepada pengguna.
 *   - Admin/Super Admin: dengar untuk SEMUA lead baru.
 *   - Agent: dengar bila lead di-assign kepada dia.
 *   - Klik loceng: papar senarai + reset nombor.
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
  if(!src) die("Beri nama fail. Contoh: node apply_notif.mjs public\\index.html");
  if(!fs.existsSync(src)) die(`Fail '${src}' tak wujud.`);
  let html = fs.readFileSync(src,"utf8");

  if(!html.includes("loginGoogle")) die("Fail belum ada Login Google.");
  if(html.includes("function startLeadNotif")) die("Fail ini nampaknya SUDAH ada notifikasi.");

  // 1) Global pembolehubah notifikasi
  html = replaceOnce(html, "let negeriOpen=new Set();",
    "let negeriOpen=new Set();\nlet unsubNotif=null,notifCount=0,notifItems=[],leadsNotifInit=false,notifKnownAgent={};",
    "notif globals");

  // 2) ensureBell() dipanggil dalam doLoginUI
  html = replaceOnce(html, "  _vis('nav-report',_isMgr);",
    "  _vis('nav-report',_isMgr);\n  ensureBell();",
    "ensureBell call");

  // 3) startLeadNotif() dalam subscribe()
  html = replaceOnce(html, "  subscribeUsers();\n",
    "  subscribeUsers();\n  startLeadNotif();\n",
    "startLeadNotif call");

  // 4) Bersih unsubNotif bila logout
  html = replaceOnce(html, "if(unsubU)unsubU(); if(unsubSA)unsubSA();",
    "if(unsubU)unsubU(); if(unsubSA)unsubSA(); if(unsubNotif)unsubNotif();",
    "notif cleanup");

  // 5) Fungsi notifikasi (sebelum subscribeUsers)
  const NOTIF = `
function playDing(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC)return;
    const ctx=new AC();
    const mk=(f,t0,t1)=>{const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0.0001,ctx.currentTime+t0);g.gain.exponentialRampToValueAtTime(0.28,ctx.currentTime+t0+0.01);g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+t1);o.start(ctx.currentTime+t0);o.stop(ctx.currentTime+t1);};
    mk(880,0,0.4); mk(1174,0.14,0.55);
  }catch(e){}
}
function updateNotifBadge(){
  const b=document.getElementById('notif-badge'); if(!b)return;
  if(notifCount>0){ b.textContent=notifCount>99?'99+':String(notifCount); b.style.display='flex'; }
  else b.style.display='none';
}
function renderNotifPanel(){
  const p=document.getElementById('notif-panel'); if(!p)return;
  if(!notifItems.length){ p.innerHTML='<div style="padding:20px;text-align:center;color:var(--text2);font-size:13px">Tiada notifikasi</div>'; return; }
  p.innerHTML='<div style="padding:10px 14px;font-size:12px;font-weight:700;color:var(--text2);border-bottom:1px solid var(--border)">Lead Baru</div>'
    +notifItems.map(function(it){
      const t=new Date(it.at); const hh=('0'+t.getHours()).slice(-2); const mm=('0'+t.getMinutes()).slice(-2);
      return '<div style="padding:10px 14px;border-bottom:1px solid var(--border)"><div style="font-size:13px;font-weight:600;color:var(--text)">'+(it.name||'Lead baru')+'</div><div style="font-size:11px;color:var(--text2);margin-top:2px">'+[it.negeri,it.agent].filter(Boolean).join(' \\u00B7 ')+'</div><div style="font-size:10px;color:var(--text3);margin-top:2px">'+hh+':'+mm+'</div></div>';
    }).join('');
}
function toggleNotifPanel(){
  const p=document.getElementById('notif-panel'); if(!p)return;
  if(p.style.display==='none'||!p.style.display){ renderNotifPanel(); p.style.display='block'; notifCount=0; updateNotifBadge(); }
  else p.style.display='none';
}
function ensureBell(){
  if(document.getElementById('notif-bell'))return;
  const rb=document.getElementById('role-badge'); if(!rb)return;
  const wrap=document.createElement('div');
  wrap.style.cssText='position:relative;margin-right:10px;display:inline-flex;align-items:center';
  wrap.innerHTML='<button id="notif-bell" title="Notifikasi" style="position:relative;background:none;border:none;cursor:pointer;padding:6px;display:flex;align-items:center;color:#64748b">'
    +'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>'
    +'<span id="notif-badge" style="display:none;position:absolute;top:2px;right:2px;min-width:16px;height:16px;padding:0 4px;background:#dc2626;color:#fff;font-size:10px;font-weight:700;border-radius:99px;align-items:center;justify-content:center;line-height:1">0</span>'
    +'</button>'
    +'<div id="notif-panel" style="display:none;position:absolute;top:40px;right:0;width:300px;max-height:380px;overflow:auto;background:#fff;border:1px solid var(--border);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.12);z-index:200"></div>';
  rb.parentNode.insertBefore(wrap, rb);
  document.getElementById('notif-bell').addEventListener('click',function(e){e.stopPropagation();toggleNotifPanel();});
  document.addEventListener('click',function(e){ const p=document.getElementById('notif-panel'); const b=document.getElementById('notif-bell'); if(p&&p.style.display==='block'&&!p.contains(e.target)&&b&&!b.contains(e.target))p.style.display='none'; });
  updateNotifBadge();
}
function addNotif(d){
  notifCount++;
  notifItems.unshift({name:d.name||'Lead baru',negeri:d.negeri||'',agent:d.agent||'',at:Date.now()});
  if(notifItems.length>30)notifItems.pop();
  updateNotifBadge(); playDing();
}
function startLeadNotif(){
  if(unsubNotif)unsubNotif();
  leadsNotifInit=false; notifKnownAgent={};
  unsubNotif=onSnapshot(collection(db,'juara_leads'),function(snap){
    const isMgr=CU&&(CU.role==='admin'||CU.role==='superadmin');
    snap.docChanges().forEach(function(ch){
      const id=ch.doc.id; const d=ch.doc.data(); const agent=d.agent||'';
      if(ch.type==='removed'){ delete notifKnownAgent[id]; return; }
      const prev=notifKnownAgent[id]; notifKnownAgent[id]=agent;
      if(!leadsNotifInit) return;
      let relevant=false;
      if(ch.type==='added'){ relevant = isMgr || (CU && agent===CU.name); }
      else if(ch.type==='modified'){ relevant = (!isMgr) && CU && agent===CU.name && prev!==CU.name; }
      if(relevant) addNotif(d);
    });
    leadsNotifInit=true;
  });
}
`;
  html = replaceOnce(html, "function subscribeUsers(){", NOTIF + "\nfunction subscribeUsers(){", "notif functions");

  fs.writeFileSync("index.html", html, "utf8");
  console.log("\n✅ SIAP! Notifikasi loceng + bunyi ditambah: index.html");
  console.log("\nLangkah seterusnya:");
  console.log("  1. move /Y index.html public\\index.html");
  console.log("  2. firebase deploy --only hosting");
  console.log("  3. Ctrl+Shift+R. Tambah satu lead untuk uji loceng + bunyi.\n");
}
main();

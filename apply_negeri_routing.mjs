#!/usr/bin/env node
/*
 * Juara Travel CRM — Auto-Assign Lead ikut NEGERI (Bahagian A + B)
 * ================================================================
 * Jalankan pada fail yang SUDAH ada Fasa 1 (login), Fasa 2 (3 level),
 * dan Minta Akses.
 *
 * CARA GUNA:
 *     node apply_negeri_routing.mjs public\index.html
 *
 * Apa ia buat:
 *   A) Tab baru "Assignment Negeri" dalam Agent & Pakej —
 *      Super Admin tetapkan setiap agent terima negeri mana (atau "Semua Negeri").
 *   B) Bila tambah lead MANUAL, agent auto-dipilih ikut negeri (rotate).
 *      Pilihan "🔄 Auto (ikut negeri)" jadi default dalam borang tambah lead.
 *   - Rotator pakej lama disembunyikan (tab "Assignment Agent" jadi tersorok).
 *
 * NOTA: Lead dari borang luar (Google Form/Apps Script) BELUM auto-assign —
 *       itu Bahagian C, fasa berikut.
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
  if(!src) die("Beri nama fail. Contoh: node apply_negeri_routing.mjs public\\index.html");
  if(!fs.existsSync(src)) die(`Fail '${src}' tak wujud.`);
  let html = fs.readFileSync(src,"utf8");

  if(!html.includes("function requestAccess()")) die("Fail belum ada Minta Akses. Jalankan penampal sebelum ini dulu.");
  if(html.includes("function nextAgentForState")) die("Fail ini nampaknya SUDAH ada auto-assign negeri.");

  // ---- 1) Global: stateAssign + unsubSA ----
  html = replaceOnce(html, "let pendingAuthUser=null;",
    "let pendingAuthUser=null;\nlet stateAssign={};let unsubSA=null;",
    "global stateAssign");

  // ---- 2) subscribe(): langgan state_assignments ----
  html = replaceOnce(html, "  subscribeUsers();\n}",
    "  subscribeUsers();\n" +
    "  if(unsubSA)unsubSA();\n" +
    "  unsubSA=onSnapshot(doc(db,'juara_config','state_assignments'),snap=>{stateAssign=snap.exists()?snap.data():{};if(document.getElementById('page-assign')&&document.getElementById('page-assign').classList.contains('active'))renderAssign();});\n}",
    "subscribe state_assignments");

  // ---- 3) Bersih unsub bila logout (null branch) ----
  html = replaceOnce(html,
    "if(unsubL)unsubL(); if(unsubC)unsubC(); if(unsubP)unsubP(); if(unsubA)unsubA(); if(unsubAgents)unsubAgents(); if(unsubH)unsubH(); if(unsubU)unsubU();",
    "if(unsubL)unsubL(); if(unsubC)unsubC(); if(unsubP)unsubP(); if(unsubA)unsubA(); if(unsubAgents)unsubAgents(); if(unsubH)unsubH(); if(unsubU)unsubU(); if(unsubSA)unsubSA();",
    "null-branch unsubSA");

  // ---- 4) Tab bar: tambah "Assignment Negeri" (aktif), sorok tab pakej lama ----
  html = replaceOnce(html,
    `<div id="tab-assignment" style="padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer;border-bottom:2px solid #2563eb;margin-bottom:-2px;color:#2563eb">Assignment Agent</div>`,
    `<div id="tab-negeri" style="padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer;border-bottom:2px solid #2563eb;margin-bottom:-2px;color:#2563eb">Assignment Negeri</div>
          <div id="tab-assignment" style="padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;color:var(--text2);display:none">Assignment Pakej (lama)</div>`,
    "tab bar negeri");

  // ---- 5) Content: negeri tab (aktif) + sorok content pakej lama ----
  html = replaceOnce(html,
    `<div id="tab-content-assignment">`,
    `<div id="tab-content-negeri">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px">
            <div style="font-size:13px;color:var(--text2)">Tetapkan agent mana terima lead dari negeri mana. Tandai "Semua Negeri" untuk agent HQ.</div>
            <button class="btn btn-p btn-sm" onclick="saveStateAssign()">💾 Simpan Assignment Negeri</button>
          </div>
          <div id="negeri-assign-list"></div>
        </div>
        <div id="tab-content-assignment" style="display:none">`,
    "tab content negeri");

  // ---- 6) switchAssignTab: sertakan 'negeri' ----
  html = replaceOnce(html,
    `['assignment','pakej','agent'].forEach(t=>{`,
    `['negeri','assignment','pakej','agent'].forEach(t=>{`,
    "switchAssignTab negeri");

  // ---- 7) INIT: daftar klik tab-negeri ----
  html = replaceOnce(html,
    `['tab-assignment','tab-pakej','tab-agent'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('click',()=>switchAssignTab(id.replace('tab-','')));});`,
    `['tab-negeri','tab-assignment','tab-pakej','tab-agent'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('click',()=>switchAssignTab(id.replace('tab-','')));});`,
    "INIT tab-negeri listener");

  // ---- 8) renderAssign: panggil renderNegeriAssign ----
  html = replaceOnce(html,
    `function renderAssign(){\n  const agentNames=allAgents.length>0?allAgents.map(a=>a.name):ALL_AGENTS;`,
    `function renderAssign(){\n  try{renderNegeriAssign();}catch(_){}\n  const agentNames=allAgents.length>0?allAgents.map(a=>a.name):ALL_AGENTS;`,
    "renderAssign call");

  // ---- 9) Borang tambah lead: pilihan Auto (ikut negeri) ----
  html = replaceOnce(html,
    "const agtEl=document.getElementById('f-agt');if(agtEl)agtEl.innerHTML=ALL_AGENTS.map(a=>`<option>${a}</option>`).join('');",
    "const agtEl=document.getElementById('f-agt');if(agtEl)agtEl.innerHTML='<option value=\"__AUTO__\">\\uD83D\\uDD04 Auto (ikut negeri)</option>'+ALL_AGENTS.map(a=>`<option value=\"${a}\">${a}</option>`).join('');",
    "f-agt auto option");

  // ---- 10) openAddLead: default agent = Auto ----
  html = replaceOnce(html,
    "populateLeadModalSelects();document.getElementById('m-lead').classList.add('open');",
    "populateLeadModalSelects();var _ag=document.getElementById('f-agt');if(_ag)_ag.value='__AUTO__';document.getElementById('m-lead').classList.add('open');",
    "openAddLead default auto");

  // ---- 11) saveLead: guna __pickAgent ----
  html = replaceOnce(html,
    "agent:document.getElementById('f-agt').value,",
    "agent:__pickAgent(document.getElementById('f-agt').value,document.getElementById('f-neg').value),",
    "saveLead pickAgent");

  // ---- 12) window registrations ----
  html = replaceOnce(html,
    "window.switchAssignTab=switchAssignTab; window.toggleCutiSekolah=toggleCutiSekolah;",
    "window.switchAssignTab=switchAssignTab; window.toggleCutiSekolah=toggleCutiSekolah;\nwindow.saveStateAssign=saveStateAssign; window.toggleAllNegeri=toggleAllNegeri; window.toggleNegeri=toggleNegeri;",
    "window negeri funcs");

  // ---- 13) Fungsi teras (sebelum subscribeUsers) ----
  const NEGERI_FUNCS = `
const NEGERI_LIST=['Selangor','W.P. Kuala Lumpur','W.P. Putrajaya','Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Perak','Perlis','Pulau Pinang','Sabah','Sarawak','Terengganu','Lain-lain'];
function agentStates(name){const v=stateAssign[name];return Array.isArray(v)?v:[];}
function agentCoversState(name,state){const st=agentStates(name);return st.indexOf('ALL')>=0||st.indexOf(state)>=0;}
function nextAgentForState(state){
  const names=(allAgents.length?allAgents.map(a=>a.name):ALL_AGENTS);
  let pool=names.filter(n=>agentCoversState(n,state));
  if(!pool.length)pool=names.filter(n=>agentStates(n).indexOf('ALL')>=0);
  if(!pool.length)return '';
  pool=pool.slice().sort();
  const count=allLeads.filter(l=>l.negeri===state&&pool.indexOf(l.agent)>=0).length;
  return pool[count%pool.length];
}
function __pickAgent(sel,negeri){ if(sel==='__AUTO__'){ const a=nextAgentForState(negeri); return a||(ALL_AGENTS[0]||''); } return sel; }
function renderNegeriAssign(){
  const el=document.getElementById('negeri-assign-list'); if(!el)return;
  const names=(allAgents.length?allAgents.map(a=>a.name):ALL_AGENTS);
  if(!names.length){el.innerHTML='<div class="empty"><div class="empty-title">Tiada agent</div></div>';return;}
  el.innerHTML=names.map(function(n){
    const esc=n.replace(/'/g,"\\\\'");
    const st=agentStates(n);
    const isAll=st.indexOf('ALL')>=0;
    const chips=NEGERI_LIST.map(function(s){
      const on=isAll||st.indexOf(s)>=0;
      const se=s.replace(/'/g,"\\\\'");
      return '<label style="display:flex;align-items:center;gap:5px;font-size:12px;padding:4px 8px;border:1px solid '+(on?'#bbf7d0':'var(--border)')+';border-radius:6px;background:'+(on?'#f0fdf4':'#fff')+';cursor:'+(isAll?'not-allowed':'pointer')+'"><input type="checkbox" '+(on?'checked':'')+' '+(isAll?'disabled':'')+" onchange=\\"toggleNegeri('"+esc+"','"+se+"',this.checked)\\">"+s+'</label>';
    }).join('');
    return '<div class="pkg-assign-card"><div class="pkg-assign-header"><div class="pkg-assign-name">'+n+'</div>'
      +'<label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;cursor:pointer;color:'+(isAll?'#15803d':'var(--text2)')+'"><input type="checkbox" '+(isAll?'checked':'')+" onchange=\\"toggleAllNegeri('"+esc+"',this.checked)\\"> Semua Negeri (HQ)</label></div>"
      +'<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">'+chips+'</div></div>';
  }).join('');
}
function toggleAllNegeri(name,checked){ stateAssign[name]=checked?['ALL']:[]; renderNegeriAssign(); }
function toggleNegeri(name,state,checked){
  let st=agentStates(name).slice();
  const ai=st.indexOf('ALL'); if(ai>=0)st.splice(ai,1);
  const j=st.indexOf(state);
  if(checked){ if(j<0)st.push(state); } else { if(j>=0)st.splice(j,1); }
  stateAssign[name]=st; renderNegeriAssign();
}
async function saveStateAssign(){
  if(!CU||CU.role!=='superadmin'){toast('Hanya Super Admin boleh ubah assignment.',true);return;}
  try{await setDoc(doc(db,'juara_config','state_assignments'),stateAssign);toast('Assignment negeri disimpan.');}
  catch(e){toast('Ralat: '+e.message,true);}
}
`;
  html = replaceOnce(html, "function subscribeUsers(){", NEGERI_FUNCS + "\nfunction subscribeUsers(){", "negeri funcs");

  fs.writeFileSync("index.html", html, "utf8");
  console.log("\n✅ SIAP! Auto-assign ikut negeri (A+B) ditambah: index.html");
  console.log("\nLangkah seterusnya:");
  console.log("  1. move -Force index.html public\\index.html");
  console.log("  2. firebase deploy --only hosting");
  console.log("  3. Buka Agent & Pakej -> tab 'Assignment Negeri' -> tetapkan negeri tiap agent -> Simpan.");
  console.log("  4. Tambah Lead manual -> biar agent 'Auto (ikut negeri)' -> agent auto-dipilih.");
  console.log("  (Borang luar = Bahagian C, fasa berikut.)\n");
}
main();

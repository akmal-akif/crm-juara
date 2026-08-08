#!/usr/bin/env node
/*
 * Juara Travel CRM — Cantikkan UI "Assignment Negeri"
 * ===================================================
 * Jalankan pada fail yang SUDAH ada auto-assign negeri (penampal sebelum ini).
 *
 * CARA GUNA:
 *     node apply_negeri_ui.mjs public\index.html
 *
 * Perubahan (fungsi kekal sama, cuma rupa jadi kemas):
 *   - Setiap agent jadi kad boleh lipat (klik untuk buka/tutup)
 *   - Negeri disusun ikut ZON (Utara/Tengah/Selatan/Pantai Timur/Borneo/Lain)
 *   - Negeri jadi "chip" warna — hijau bila dipilih, kelabu bila tidak
 *   - Header tunjuk avatar + bilangan negeri dipilih
 */

import fs from "fs";

function die(m){ console.error("\nRALAT: "+m+"\n"); process.exit(1); }

function main(){
  const src = process.argv[2];
  if(!src) die("Beri nama fail. Contoh: node apply_negeri_ui.mjs public\\index.html");
  if(!fs.existsSync(src)) die(`Fail '${src}' tak wujud.`);
  let html = fs.readFileSync(src,"utf8");

  if(!html.includes("function renderNegeriAssign(")) die("Fail belum ada auto-assign negeri. Jalankan penampal negeri dulu.");
  if(html.includes("let negeriOpen=new Set()")) die("Fail ini nampaknya SUDAH ada UI baru.");

  // 1) Global negeriOpen
  const i1 = html.indexOf("let stateAssign={};let unsubSA=null;");
  if(i1===-1) die("Tak jumpa pemboleh ubah stateAssign.");
  html = html.replace("let stateAssign={};let unsubSA=null;",
                      "let stateAssign={};let unsubSA=null;\nlet negeriOpen=new Set();");

  // 2) Ganti fungsi renderNegeriAssign lama dengan versi baru (+ toggleNegeriCard)
  const re = /function renderNegeriAssign\(\)\{[\s\S]*?\n\}\n/;
  const m = html.match(re);
  if(!m) die("Tak jumpa fungsi renderNegeriAssign untuk diganti.");
  if(html.match(new RegExp(re.source,'g')).length!==1) die("renderNegeriAssign dijumpai lebih sekali — tak selamat.");

  const NEW_RENDER = `function toggleNegeriCard(name){ if(negeriOpen.has(name))negeriOpen.delete(name); else negeriOpen.add(name); renderNegeriAssign(); }
function renderNegeriAssign(){
  const el=document.getElementById('negeri-assign-list'); if(!el)return;
  const names=(allAgents.length?allAgents.map(a=>a.name):ALL_AGENTS);
  if(!names.length){el.innerHTML='<div class="empty"><div class="empty-title">Tiada agent</div></div>';return;}
  const ZONES=[['Utara',['Perlis','Kedah','Pulau Pinang','Perak']],['Tengah',['Selangor','W.P. Kuala Lumpur','W.P. Putrajaya','Negeri Sembilan']],['Selatan',['Melaka','Johor']],['Pantai Timur',['Kelantan','Terengganu','Pahang']],['Borneo',['Sabah','Sarawak']],['Lain',['Lain-lain']]];
  el.innerHTML=names.map(function(n){
    const st=agentStates(n);
    const isAll=st.indexOf('ALL')>=0;
    const cnt=isAll?16:st.length;
    const open=negeriOpen.has(n);
    const av=avC(n);
    const summary=isAll
      ? '<span style="font-size:11px;font-weight:700;padding:3px 11px;border-radius:99px;background:#dcfce7;color:#15803d">Semua Negeri</span>'
      : (cnt>0
         ? '<span style="font-size:11px;font-weight:600;padding:3px 11px;border-radius:99px;background:#eff6ff;color:#1e40af">'+cnt+' negeri</span>'
         : '<span style="font-size:11px;font-weight:600;padding:3px 11px;border-radius:99px;background:#f1f5f9;color:#94a3b8">Belum ditetapkan</span>');
    const allBtn='<div data-act="all" data-name="'+n+'" style="user-select:none;font-size:11px;font-weight:600;padding:5px 12px;border-radius:99px;cursor:pointer;border:1px solid '+(isAll?'#86efac':'#e2e8f0')+';background:'+(isAll?'#16a34a':'#fff')+';color:'+(isAll?'#fff':'#64748b')+'">Semua Negeri (HQ)</div>';
    const body=ZONES.map(function(z){
      const chips=z[1].map(function(s){
        const on=isAll||st.indexOf(s)>=0;
        return '<div data-act="state" data-name="'+n+'" data-state="'+s+'" style="user-select:none;font-size:12px;font-weight:500;padding:6px 13px;border-radius:99px;border:1px solid '+(on?'#86efac':'#e2e8f0')+';background:'+(on?'#16a34a':'#fff')+';color:'+(on?'#fff':'#64748b')+';cursor:'+(isAll?'not-allowed':'pointer')+';opacity:'+(isAll?'0.5':'1')+'">'+s+'</div>';
      }).join('');
      return '<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">'+z[0]+'</div><div style="display:flex;flex-wrap:wrap;gap:7px">'+chips+'</div></div>';
    }).join('');
    return '<div style="background:#fff;border:1px solid var(--border);border-radius:10px;box-shadow:var(--shadow);margin-bottom:10px;overflow:hidden">'
      +'<div data-act="card" data-name="'+n+'" style="display:flex;align-items:center;gap:12px;padding:13px 16px;cursor:pointer;flex-wrap:wrap">'
        +'<div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;'+av+'">'+(n[0]||'?')+'</div>'
        +'<div style="flex:1;min-width:120px"><div style="font-size:14px;font-weight:700">'+n+'</div></div>'
        +summary+allBtn
        +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" style="flex-shrink:0;transition:transform .2s;transform:rotate('+(open?'180':'0')+'deg)"><polyline points="6 9 12 15 18 9"></polyline></svg>'
      +'</div>'
      +'<div style="display:'+(open?'block':'none')+';padding:10px 16px 16px;border-top:1px solid var(--border)">'+body+'</div>'
    +'</div>';
  }).join('');
  el.onclick=function(e){
    const t=e.target.closest('[data-act]'); if(!t)return;
    const act=t.getAttribute('data-act'); const name=t.getAttribute('data-name');
    if(act==='card'){ toggleNegeriCard(name); }
    else if(act==='all'){ const isAll=agentStates(name).indexOf('ALL')>=0; toggleAllNegeri(name,!isAll); }
    else if(act==='state'){ const isAll=agentStates(name).indexOf('ALL')>=0; if(isAll)return; const s=t.getAttribute('data-state'); const on=agentStates(name).indexOf(s)>=0; toggleNegeri(name,s,!on); }
  };
}
`;
  html = html.replace(re, NEW_RENDER);

  fs.writeFileSync("index.html", html, "utf8");
  console.log("\n✅ SIAP! UI Assignment Negeri dicantikkan: index.html");
  console.log("\nLangkah seterusnya:");
  console.log("  1. move -Force index.html public\\index.html");
  console.log("  2. firebase deploy --only hosting");
  console.log("  3. Ctrl+Shift+R, buka Agent & Pakej > Assignment Negeri.\n");
}
main();

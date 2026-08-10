/* ==== Juara Travel — Borang Lead (embeddable widget) ====
   Letak <div data-jt-form data-form="..." data-package="..." data-campaign="..." data-endpoint="..."></div>
   pada mana-mana laman, kemudian <script src=".../embed.js" async></script>.
   Setiap borang (data-form) ada giliran agent sendiri — CRM > Settings > Borang Lead.
   Lead yang dihantar terus masuk CRM dan diagihkan secara round-robin. */
(function(){
  'use strict';
  var NEGERI = ['Perlis','Kedah','Pulau Pinang','Perak','Selangor','Kuala Lumpur','Putrajaya',
    'Negeri Sembilan','Melaka','Johor','Pahang','Terengganu','Kelantan','Sabah','Sarawak','Labuan'];
  var STYLE_ID = 'jtf-style-v1';

  function ensureStyle(){
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      '.jtf-box{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;max-width:420px}' +
      '.jtf-lb{font-size:14px;font-weight:600;color:#3c4a66;margin:14px 0 6px}' +
      '.jtf-lb:first-child{margin-top:0}' +
      '.jtf-in{width:100%;box-sizing:border-box;border:1.5px solid #e0e6f2;border-radius:10px;padding:11px 13px;' +
        'font-size:15px;color:#0f172a;outline:none;background:#fff;font-family:inherit}' +
      '.jtf-in:focus{border-color:#2563eb}' +
      '.jtf-btn{margin-top:16px;width:100%;background:#2563eb;color:#fff;border:none;border-radius:10px;' +
        'padding:13px;font-size:15.5px;font-weight:700;cursor:pointer;font-family:inherit}' +
      '.jtf-btn:hover{background:#1d4ed8}' +
      '.jtf-btn:disabled{opacity:.6;cursor:default}' +
      '.jtf-msg{margin-top:12px;font-size:14px;padding:10px 12px;border-radius:9px;display:none}' +
      '.jtf-msg.ok{display:block;background:#e7f6ec;color:#15803d}' +
      '.jtf-msg.err{display:block;background:#fdecec;color:#b91c1c}';
    document.head.appendChild(s);
  }

  function el(tag, attrs, children){
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function(k){
      if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function(c){ e.appendChild(c); });
    return e;
  }

  function field(labelTxt, inputEl){
    var wrap = document.createDocumentFragment();
    wrap.appendChild(el('div', { class:'jtf-lb', text:labelTxt }));
    wrap.appendChild(inputEl);
    return wrap;
  }

  function render(target, opts){
    opts = opts || {};
    var formId = opts.formId || target.getAttribute('data-form') || '';
    var pakej = opts.package || target.getAttribute('data-package') || '';
    var campaign = opts.campaign || target.getAttribute('data-campaign') || '';
    var endpoint = opts.endpoint || target.getAttribute('data-endpoint') || '';
    var preview = !!opts.preview;

    ensureStyle();
    target.innerHTML = '';
    var box = el('div', { class:'jtf-box' });

    var name = el('input', { class:'jtf-in', type:'text', placeholder:'Contoh: Ahmad bin Ali', required:'required' });
    var phone = el('input', { class:'jtf-in', type:'tel', placeholder:'Contoh: 0129876543', required:'required' });
    var negeri = el('select', { class:'jtf-in' }, [el('option', { value:'', text:'Pilih negeri' })]
      .concat(NEGERI.map(function(n){ return el('option', { value:n, text:n }); })));
    var pax = el('input', { class:'jtf-in', type:'number', min:'1', value:'1' });
    var tarikh = el('input', { class:'jtf-in', type:'text', placeholder:'Contoh: September 2026' });
    var btn = el('button', { class:'jtf-btn', type:'submit', text: preview ? 'Hantar (pratonton)' : 'Hantar' });
    var msg = el('div', { class:'jtf-msg' });

    var form = el('form', {});
    form.appendChild(field('Nama penuh', name));
    form.appendChild(field('No. WhatsApp', phone));
    form.appendChild(field('Negeri', negeri));
    form.appendChild(field('Bilangan pax', pax));
    form.appendChild(field('Tarikh hasrat berlepas (jika ada)', tarikh));
    form.appendChild(btn);
    form.appendChild(msg);
    box.appendChild(form);
    target.appendChild(box);

    function showMsg(kind, text){
      msg.className = 'jtf-msg ' + kind;
      msg.textContent = text;
    }

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (preview){ showMsg('ok', 'Ini pratonton borang — tiada data dihantar.'); return; }
      if (!endpoint){ showMsg('err', 'Borang belum disambungkan. Sila hubungi pentadbir.'); return; }
      btn.disabled = true;
      var payload = {
        name: name.value.trim(), phone: phone.value.trim(), negeri: negeri.value,
        pax: pax.value, tarikh: tarikh.value.trim(), pakej: pakej, campaign: campaign, formId: formId
      };
      fetch(endpoint, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }).then(function(){
        showMsg('ok', 'Terima kasih! Kami akan hubungi anda tidak lama lagi.');
        form.reset(); pax.value = '1'; btn.disabled = false;
      }).catch(function(){
        showMsg('err', 'Ralat menghantar borang. Sila cuba lagi.');
        btn.disabled = false;
      });
    });
  }

  function scan(){
    var nodes = document.querySelectorAll('[data-jt-form]');
    for (var i = 0; i < nodes.length; i++){
      var n = nodes[i];
      if (n.getAttribute('data-jtf-rendered')) continue;
      n.setAttribute('data-jtf-rendered', '1');
      render(n, {});
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();

  window.JTForm = { render: render, rescan: scan };
})();

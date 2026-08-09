export function parseCRMDate(raw) {
  if (!raw) return new Date(0);
  if (raw && typeof raw.toDate === 'function') return raw.toDate();
  if (raw && raw.seconds) return new Date(raw.seconds * 1000);
  if (raw instanceof Date) return raw;
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

export function closedDate(lead) {
  return parseCRMDate(lead.closedAt || lead.updatedAt || lead.date || lead.createdAt);
}

export function normalizePhoneMY(raw) {
  let p = (raw || '').replace(/\D/g, '');
  if (!p) return '';
  if (p.indexOf('60') === 0) return p;
  if (p.indexOf('0') === 0) return '60' + p.slice(1);
  return '60' + p;
}

export function validateLead(data) {
  const name = String(data.name || '').trim();
  if (name.length < 3) return 'Sila isi nama penuh pelanggan';
  const phone = String(data.phone || '').trim();
  if (normalizePhoneMY(phone).length < 10) return 'Nombor telefon tidak lengkap';
  const totalPax = Math.max(1, parseInt(data.pax, 10) || 1);
  const bilikDetail = data.bilikDetail || [];
  const jumlahDiagih = bilikDetail.reduce((s, b) => s + b.pax, 0);
  if (jumlahDiagih !== totalPax) {
    return `Agihan bilik mesti sama dengan jumlah pax. Sekarang ${jumlahDiagih} daripada ${totalPax} pax.`;
  }
  return null;
}

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

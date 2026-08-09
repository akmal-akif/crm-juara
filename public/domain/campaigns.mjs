import { parseCRMDate } from './leads.mjs';

export function normCampaignName(n) {
  return String(n || '').trim().toLowerCase().replace(/[–—−]/g, '-').replace(/\s+/g, ' ');
}

export function campaignUpdatedMs(k) {
  const d = parseCRMDate(k.updatedAt || k.createdAt || k.date || k.dateStart || 0);
  return d && !isNaN(d.getTime()) ? d.getTime() : 0;
}

function campaignGroups(camps) {
  const g = {};
  (camps || []).forEach(k => {
    const key = normCampaignName(k.name);
    if (!key) return;
    (g[key] || (g[key] = [])).push(k);
  });
  return g;
}

export function canonicalCampaigns(camps) {
  const out = [];
  const groups = campaignGroups(camps);
  Object.keys(groups).forEach(key => {
    const group = groups[key].slice().sort((a, b) => campaignUpdatedMs(b) - campaignUpdatedMs(a));
    const base = Object.assign({}, group[0]);
    ['platform', 'dateStart', 'dateEnd', 'pakejLink'].forEach(f => { if (!base[f]) { const hit = group.find(x => x[f]); if (hit) base[f] = hit[f]; } });
    if (!(parseFloat(base.spend) > 0)) base.spend = Math.max.apply(null, group.map(x => parseFloat(x.spend) || 0).concat([0]));
    if (!(parseFloat(base.budget) > 0)) base.budget = Math.max.apply(null, group.map(x => parseFloat(x.budget) || 0).concat([0]));
    base.name = String(base.name || group[0].name || '').trim();
    base._duplicateIds = group.slice(1).map(x => x._id);
    base._duplicateCount = base._duplicateIds.length;
    out.push(base);
  });
  return out.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

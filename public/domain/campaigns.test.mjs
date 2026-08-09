import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normCampaignName, campaignUpdatedMs, canonicalCampaigns } from './campaigns.mjs';

test('normCampaignName: trims, lowercases, collapses whitespace', () => {
  assert.equal(normCampaignName('  Umrah  Eko  '), 'umrah eko');
});

test('normCampaignName: normalizes en/em dash and minus to hyphen', () => {
  assert.equal(normCampaignName('Umrah–Eko'), 'umrah-eko');
  assert.equal(normCampaignName('Umrah—Eko'), 'umrah-eko');
  assert.equal(normCampaignName('Umrah−Eko'), 'umrah-eko');
});

test('normCampaignName: empty/nullish input returns empty string', () => {
  assert.equal(normCampaignName(null), '');
  assert.equal(normCampaignName(undefined), '');
  assert.equal(normCampaignName(''), '');
});

test('campaignUpdatedMs: prefers updatedAt over createdAt/date/dateStart', () => {
  const k = { updatedAt: '2026-05-01', createdAt: '2026-01-01', date: '2026-02-01', dateStart: '2026-03-01' };
  assert.equal(campaignUpdatedMs(k), new Date(2026, 4, 1).getTime());
});

test('campaignUpdatedMs: falls back through the chain to dateStart', () => {
  const k = { dateStart: '2026-03-01' };
  assert.equal(campaignUpdatedMs(k), new Date(2026, 2, 1).getTime());
});

test('campaignUpdatedMs: no date fields returns 0', () => {
  assert.equal(campaignUpdatedMs({}), 0);
});

test('canonicalCampaigns: groups campaigns by normalized name, keeps most-recently-updated as base', () => {
  const camps = [
    { _id: 'A', name: 'Umrah Eko', updatedAt: '2026-01-01', spend: '100', budget: '500' },
    { _id: 'B', name: 'umrah  eko', updatedAt: '2026-03-01', spend: '0', budget: '0', platform: 'Meta Ads' },
  ];
  const out = canonicalCampaigns(camps);
  assert.equal(out.length, 1);
  assert.equal(out[0]._id, 'B');
  assert.equal(out[0].platform, 'Meta Ads');
});

test('canonicalCampaigns: fills missing platform/dateStart/dateEnd/pakejLink from any duplicate that has it', () => {
  const camps = [
    { _id: 'A', name: 'Haji', updatedAt: '2026-01-01', platform: 'Meta Ads', dateStart: '2026-01-01' },
    { _id: 'B', name: 'Haji', updatedAt: '2026-02-01' },
  ];
  const out = canonicalCampaigns(camps);
  assert.equal(out[0]._id, 'B');
  assert.equal(out[0].platform, 'Meta Ads');
  assert.equal(out[0].dateStart, '2026-01-01');
});

test('canonicalCampaigns: takes the max spend/budget across duplicates when base has none', () => {
  const camps = [
    { _id: 'A', name: 'Haji', updatedAt: '2026-02-01', spend: '0', budget: '0' },
    { _id: 'B', name: 'Haji', updatedAt: '2026-01-01', spend: '250', budget: '1000' },
  ];
  const out = canonicalCampaigns(camps);
  assert.equal(out[0]._id, 'A');
  assert.equal(out[0].spend, 250);
  assert.equal(out[0].budget, 1000);
});

test('canonicalCampaigns: records duplicate ids and count', () => {
  const camps = [
    { _id: 'A', name: 'Haji', updatedAt: '2026-02-01' },
    { _id: 'B', name: 'Haji', updatedAt: '2026-01-01' },
    { _id: 'C', name: 'Haji', updatedAt: '2026-01-15' },
  ];
  const out = canonicalCampaigns(camps);
  assert.equal(out[0]._duplicateCount, 2);
  assert.deepEqual(out[0]._duplicateIds.sort(), ['B', 'C']);
});

test('canonicalCampaigns: campaigns without a name are dropped from grouping', () => {
  const camps = [{ _id: 'A', name: '', updatedAt: '2026-01-01' }];
  assert.deepEqual(canonicalCampaigns(camps), []);
});

test('canonicalCampaigns: result sorted alphabetically by name', () => {
  const camps = [
    { _id: 'A', name: 'Zon Kempen', updatedAt: '2026-01-01' },
    { _id: 'B', name: 'Anugerah Kempen', updatedAt: '2026-01-01' },
  ];
  const out = canonicalCampaigns(camps);
  assert.deepEqual(out.map(c => c.name), ['Anugerah Kempen', 'Zon Kempen']);
});

test('canonicalCampaigns: empty/missing input returns empty array', () => {
  assert.deepEqual(canonicalCampaigns([]), []);
  assert.deepEqual(canonicalCampaigns(undefined), []);
});

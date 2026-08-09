import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normAgentKey, isDuplicateAgent, agentCompletenessScore, validateAgent, renameAgentCascade } from './agents.mjs';

const baseUsers = [
  { _id: 'ahmad@gmail.com', email: 'ahmad@gmail.com', name: 'Ahmad Zaki', status: 'active' },
  { _id: 'siti@gmail.com', email: 'siti@gmail.com', name: 'Siti Aisyah', status: 'active' },
  { _id: 'old@gmail.com', email: 'old@gmail.com', name: 'Farid Lama', status: 'inactive' },
];

test('normAgentKey: trims and lowercases', () => {
  assert.equal(normAgentKey('  Ahmad Zaki  '), 'ahmad zaki');
});

test('normAgentKey: nullish/empty returns empty string', () => {
  assert.equal(normAgentKey(null), '');
  assert.equal(normAgentKey(undefined), '');
  assert.equal(normAgentKey(''), '');
});

test('isDuplicateAgent: same name, different case/whitespace is a duplicate', () => {
  assert.equal(isDuplicateAgent({ name: 'Ahmad Zaki' }, { name: '  ahmad zaki  ' }), true);
});

test('isDuplicateAgent: different names is not a duplicate', () => {
  assert.equal(isDuplicateAgent({ name: 'Ahmad Zaki' }, { name: 'Ahmad Fauzi' }), false);
});

test('isDuplicateAgent: both blank/missing names is not a duplicate', () => {
  assert.equal(isDuplicateAgent({ name: '' }, { name: '' }), false);
  assert.equal(isDuplicateAgent({}, {}), false);
});

test('agentCompletenessScore: counts non-empty scalar fields', () => {
  const score = agentCompletenessScore({ name: 'Ahmad', phone: '60123456789', email: '' });
  assert.equal(score, 2);
});

test('agentCompletenessScore: ignores null/undefined/empty-string values', () => {
  assert.equal(agentCompletenessScore({ a: null, b: undefined, c: '' }), 0);
});

test('agentCompletenessScore: nested non-empty object fields count extra for each non-zero/non-falsy value', () => {
  const score = agentCompletenessScore({ name: 'Ahmad', roomAllocation: { single: 2, twin: 0, triple: 1 } });
  // name (1) + roomAllocation itself (1) + non-falsy nested values (single=2, triple=1) => 1 + 1 + 2 = 4
  assert.equal(score, 4);
});

test('agentCompletenessScore: a more complete record scores higher than a sparser one', () => {
  const sparse = agentCompletenessScore({ name: 'Ahmad' });
  const full = agentCompletenessScore({ name: 'Ahmad', phone: '60123456789', cawangan: 'JT HQ' });
  assert.ok(full > sparse);
});

test('validateAgent: rejects malformed email', () => {
  const r = validateAgent({ idSedia: '', email: 'not-an-email', name: 'Baru', phone: '60123456789', allUsers: baseUsers });
  assert.equal(r.error, 'E-mel tidak sah.');
});

test('validateAgent: rejects empty name', () => {
  const r = validateAgent({ idSedia: '', email: 'baru@gmail.com', name: '', phone: '60123456789', allUsers: baseUsers });
  assert.equal(r.error, 'Nama penuh wajib diisi.');
});

test('validateAgent: rejects short/missing phone', () => {
  const r = validateAgent({ idSedia: '', email: 'baru@gmail.com', name: 'Baru', phone: '123', allUsers: baseUsers });
  assert.equal(r.error, 'No. WhatsApp wajib diisi dengan format yang sah.');
});

test('validateAgent: rejects email already used by another account', () => {
  const r = validateAgent({ idSedia: '', email: 'ahmad@gmail.com', name: 'Baru', phone: '60123456789', allUsers: baseUsers });
  assert.equal(r.error, 'E-mel ini sudah digunakan oleh akaun lain.');
});

test('validateAgent: rejects name already used by another ACTIVE agent', () => {
  const r = validateAgent({ idSedia: '', email: 'baru@gmail.com', name: 'Ahmad Zaki', phone: '60123456789', allUsers: baseUsers });
  assert.equal(r.error, 'Nama "Ahmad Zaki" sudah digunakan agent lain.');
});

test('validateAgent: name clash against an inactive agent is allowed', () => {
  const r = validateAgent({ idSedia: '', email: 'baru@gmail.com', name: 'Farid Lama', phone: '60123456789', allUsers: baseUsers });
  assert.equal(r.error, null);
});

test('validateAgent: editing self (same id, same email) is not flagged as an email clash', () => {
  const r = validateAgent({ idSedia: 'ahmad@gmail.com', email: 'ahmad@gmail.com', name: 'Ahmad Zaki', phone: '60123456789', allUsers: baseUsers });
  assert.equal(r.error, null);
  assert.equal(r.emailChanged, false);
});

test('validateAgent: changing email is detected via emailChanged, blocked for the bootstrap admin', () => {
  const r = validateAgent({ idSedia: 'ahmad@gmail.com', email: 'new@gmail.com', name: 'Ahmad Zaki', phone: '60123456789', allUsers: baseUsers, bootstrapAdminEmail: 'ahmad@gmail.com' });
  assert.equal(r.emailChanged, true);
  assert.equal(r.error, 'E-mel Super Admin utama tidak boleh ditukar melalui CRM.');
});

test('validateAgent: changing email is blocked when it belongs to the currently logged-in session', () => {
  const r = validateAgent({ idSedia: 'ahmad@gmail.com', email: 'new@gmail.com', name: 'Ahmad Zaki', phone: '60123456789', allUsers: baseUsers, currentUserEmail: 'ahmad@gmail.com' });
  assert.equal(r.error, 'E-mel akaun yang sedang digunakan tidak boleh ditukar. Log masuk menggunakan Super Admin lain terlebih dahulu.');
});

test('validateAgent: valid edit with an email change (not self, not bootstrap admin) passes with emailChanged true', () => {
  const r = validateAgent({ idSedia: 'siti@gmail.com', email: 'siti2@gmail.com', name: 'Siti Aisyah', phone: '60123456789', allUsers: baseUsers });
  assert.equal(r.error, null);
  assert.equal(r.emailChanged, true);
  assert.equal(r.lama._id, 'siti@gmail.com');
});

test('validateAgent: adding a brand new agent (no idSedia) has lama=null and emailChanged=false', () => {
  const r = validateAgent({ idSedia: '', email: 'baru@gmail.com', name: 'Baru', phone: '60123456789', allUsers: baseUsers });
  assert.equal(r.error, null);
  assert.equal(r.lama, null);
  assert.equal(r.emailChanged, false);
});

test('renameAgentCascade: returns lead ids assigned to the old name', () => {
  const allLeads = [
    { _id: 'L1', agent: 'Ahmad Zaki' },
    { _id: 'L2', agent: 'Siti Aisyah' },
    { _id: 'L3', agent: 'Ahmad Zaki' },
  ];
  const r = renameAgentCascade('Ahmad Zaki', 'Ahmad Zaki Baru', { allLeads, stateAssign: {} });
  assert.deepEqual(r.leadIdsToUpdate.sort(), ['L1', 'L3']);
});

test('renameAgentCascade: carries over stateAssign entry for the old name when present', () => {
  const r = renameAgentCascade('Ahmad Zaki', 'Ahmad Zaki Baru', { allLeads: [], stateAssign: { 'Ahmad Zaki': ['Selangor', 'Perak'] } });
  assert.deepEqual(r.stateAssignValue, ['Selangor', 'Perak']);
});

test('renameAgentCascade: stateAssignValue is undefined when old name has no assignment', () => {
  const r = renameAgentCascade('Ahmad Zaki', 'Ahmad Zaki Baru', { allLeads: [], stateAssign: {} });
  assert.equal(r.stateAssignValue, undefined);
});

test('renameAgentCascade: no matching leads returns an empty array', () => {
  const r = renameAgentCascade('Nobody', 'Somebody', { allLeads: [{ _id: 'L1', agent: 'Someone Else' }], stateAssign: {} });
  assert.deepEqual(r.leadIdsToUpdate, []);
});

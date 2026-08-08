import { test } from 'node:test';
import assert from 'node:assert/strict';
import { closedDate, parseCRMDate } from './leads.mjs';

test('parseCRMDate: empty/falsy raw returns epoch', () => {
  assert.equal(parseCRMDate(null).getTime(), 0);
  assert.equal(parseCRMDate(undefined).getTime(), 0);
  assert.equal(parseCRMDate('').getTime(), 0);
});

test('parseCRMDate: Firestore Timestamp-like object with toDate()', () => {
  const target = new Date(2026, 2, 15);
  const timestamp = { toDate: () => target };
  assert.equal(parseCRMDate(timestamp).getTime(), target.getTime());
});

test('parseCRMDate: Firestore Timestamp-like object with seconds', () => {
  const seconds = 1_700_000_000;
  assert.equal(parseCRMDate({ seconds }).getTime(), seconds * 1000);
});

test('parseCRMDate: Date instance passed through unchanged', () => {
  const d = new Date(2026, 0, 1);
  assert.equal(parseCRMDate(d).getTime(), d.getTime());
});

test('parseCRMDate: ISO date-only string parsed as local time', () => {
  const d = parseCRMDate('2026-03-15');
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 2);
  assert.equal(d.getDate(), 15);
});

test('parseCRMDate: other date strings parsed via Date constructor', () => {
  const d = parseCRMDate('2026-03-15T10:30:00.000Z');
  assert.equal(d.getTime(), new Date('2026-03-15T10:30:00.000Z').getTime());
});

test('parseCRMDate: unparseable string falls back to epoch', () => {
  assert.equal(parseCRMDate('not a date').getTime(), 0);
});

test('closedDate: prefers closedAt over updatedAt/date/createdAt', () => {
  const lead = { closedAt: '2026-05-01', updatedAt: '2026-04-01', date: '2026-03-01', createdAt: '2026-02-01' };
  assert.equal(closedDate(lead).getFullYear(), 2026);
  assert.equal(closedDate(lead).getMonth(), 4);
  assert.equal(closedDate(lead).getDate(), 1);
});

test('closedDate: falls back to updatedAt when closedAt is missing', () => {
  const lead = { updatedAt: '2026-04-01', date: '2026-03-01', createdAt: '2026-02-01' };
  assert.equal(closedDate(lead).getMonth(), 3);
});

test('closedDate: falls back to date when closedAt/updatedAt are missing', () => {
  const lead = { date: '2026-03-01', createdAt: '2026-02-01' };
  assert.equal(closedDate(lead).getMonth(), 2);
});

test('closedDate: falls back to createdAt when nothing else is set', () => {
  const lead = { createdAt: '2026-02-01' };
  assert.equal(closedDate(lead).getMonth(), 1);
});

test('closedDate: no date fields at all returns epoch', () => {
  assert.equal(closedDate({}).getTime(), 0);
});

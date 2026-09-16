const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('services/record-utils.ts', 'utf8');
const result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const context = { exports: {}, Date };
vm.runInNewContext(result.outputText, context);
const { filterRecords, isValidDateInput } = context.exports;
assert.equal(isValidDateInput('2026-02-29'), false);
assert.equal(isValidDateInput('2024-02-29'), true);
assert.equal(isValidDateInput('2026-13-01'), false);
assert.equal(isValidDateInput('2026-9-1'), false);
assert.equal(isValidDateInput(''), true);
const records = [
  { id: 'outside', patientId: 'a', createdAt: '2026-09-09T23:59:59' },
  { id: 'start', patientId: 'a', createdAt: '2026-09-10T00:00:00' },
  { id: 'other', patientId: 'b', createdAt: '2026-09-16T12:00:00' },
  { id: 'end', patientId: 'a', createdAt: '2026-09-16T23:59:59.999' },
  { id: 'future', patientId: 'a', createdAt: '2026-09-17T00:00:00' },
];
const ids = items => Array.from(items, r => r.id);
assert.deepEqual(ids(filterRecords(records, { patientId: 'a', period: '自訂', start: '2026-09-10', end: '2026-09-16' })), ['end', 'start']);
assert.deepEqual(ids(filterRecords(records, { patientId: '', period: '近7天', start: '', end: '' }, new Date('2026-09-16T12:00:00'))), ['other', 'start']);
assert.deepEqual(ids(filterRecords(records, { patientId: 'missing', period: '全部', start: '', end: '' })), []);
assert.equal(records[0].id, 'outside', 'Filtering must not mutate original record order');
console.log('Record filters passed: date validation, inclusive boundaries, person selection, rolling dates and immutable ordering.');
const { editRecord, removeRecord } = context.exports;
const original = [{ id: 'a', patientId: 'person', createdAt: '2026-09-16T12:00:00', aiResult: { frequency: 6 }, symptoms: [] }, { id: 'b', patientId: 'other' }];
const updated = editRecord(original, 'a', { note: 'Updated', symptoms: ['無症狀'] });
assert.equal(updated[0].createdAt, original[0].createdAt);
assert.equal(updated[0].aiResult, original[0].aiResult, 'Editing must preserve original analysis');
assert.equal(original[0].note, undefined, 'Editing must not mutate the original');
assert.equal(updated[1], original[1], 'Unrelated records must remain unchanged');
assert.deepEqual(ids(removeRecord(updated, 'a')), ['b']);
assert.equal(updated.length, 2, 'Deletion must not mutate the previous snapshot');
assert.deepEqual(ids(removeRecord(updated, 'missing')), ['a', 'b']);
console.log('Record edits and deletion passed: metadata preservation, target-only deletion and immutable snapshots.');

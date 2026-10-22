const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('services/legacy-data.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
const { keepUserPatients } = context.exports;
const seed = { id: 'P-1001', name: '王小明', age: 28, gender: 'M', bedNumber: '302-1', note: '例行性健康檢查，無特殊腸胃症狀。', createdAt: '2026-05-30T10:00:00Z' };
assert.equal(keepUserPatients([seed]).length, 0);
for (const changed of [{ name: '本人' }, { age: 30 }, { note: '我的備註' }, { subjectType: 'participant' }, { id: 'new-id' }]) {
  assert.equal(keepUserPatients([{ ...seed, ...changed }]).length, 1);
}
const original = JSON.stringify(seed);
keepUserPatients([seed]);
assert.equal(JSON.stringify(seed), original);
console.log('Legacy data tests passed: untouched starters hidden, user profiles and edits preserved.');

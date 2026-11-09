const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync('services/measurement.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const context = { exports: {}, AbortController, setTimeout, clearTimeout };
vm.runInNewContext(compiled, context);
const { MeasurementSession } = context.exports;
const input = { patientId: 'alice', symptoms: [], mealTime: '未填寫' };
const audio = { uri: 'test://audio', mimeType: 'audio/wav', duration: 20 };
const result = { id: 'server-record', patientId: 'alice', duration: 20, createdAt: '2026-10-22T00:00:00Z',
  aiResult: { status: 'normal', frequency: null, confidence: null, notes: '', waveform: [0, 0.5, -0.5], spectrogram: [] } };
const completed = { status: 'completed', result };
function setup(overrides = {}, timing = { requestMs: 100, pollMs: 0, maxPolls: 2 }) {
  const states = [];
  const adapter = { available: true, capture: async () => audio, upload: async () => completed, poll: async () => completed, ...overrides };
  const session = new MeasurementSession(adapter, input, 'stable-key', s => states.push(s), timing);
  return { session, states, adapter };
}
async function main() {
  const success = setup();
  await success.session.run();
  assert.equal(success.states.map(s => s.phase).join(','), 'recording,uploading,completed');
  await success.session.run();
  assert.equal(success.states.length, 3);
  let captures = 0; const keys = [];
  const retry = setup({
    capture: async () => { captures++; return audio; },
    upload: async (_audio, _input, key) => { keys.push(key); if (keys.length === 1) throw new Error('network'); return completed; },
  });
  await retry.session.run(); assert.equal(retry.states.at(-1).phase, 'failed');
  await retry.session.run();
  assert.equal(captures, 1); assert.equal(keys.join(','), 'stable-key,stable-key');
  assert.equal(retry.states.at(-1).phase, 'completed');
  let uploads = 0; let polls = 0;
  const job = setup({
    upload: async () => { uploads++; return { status: 'processing', jobId: 'job-1' }; },
    poll: async id => { assert.equal(id, 'job-1'); if (++polls === 1) throw new Error('network'); return completed; },
  });
  await job.session.run(); await job.session.run();
  assert.equal(uploads, 1); assert.equal(polls, 2); assert.equal(job.states.at(-1).phase, 'completed');
  for (const [reply, phase] of [[{ status: 'insufficient_audio' }, 'insufficient_audio'], [{ status: 'failed' }, 'analysis_failed']]) {
    const check = setup({ upload: async () => reply });
    await check.session.run(); assert.equal(check.states.at(-1).phase, phase);
    assert.equal(check.states.some(s => s.result), false);
  }
  for (const badResult of [
    { ...result, patientId: 'bob' },
    { ...result, duration: 30 },
    { ...result, aiResult: { ...result.aiResult, status: 'unknown' } },
    { ...result, aiResult: { ...result.aiResult, confidence: 99 } },
    { ...result, aiResult: { ...result.aiResult, waveform: [NaN] } },
  ]) {
    const bad = setup({ upload: async () => ({ status: 'completed', result: badResult }) });
    await bad.session.run(); assert.equal(bad.states.at(-1).phase, 'failed');
    assert.equal(bad.states.some(s => s.result), false);
  }
  const unavailable = setup({ available: false, capture: () => { throw new Error('must not capture'); } });
  await unavailable.session.run(); assert.equal(unavailable.states.length, 1);
  assert.equal(unavailable.states[0].phase, 'failed');
  const timeout = setup({ upload: () => new Promise(() => {}) }, { requestMs: 5, pollMs: 0, maxPolls: 1 });
  await timeout.session.run(); assert.equal(timeout.states.at(-1).phase, 'failed');
  const waiting = setup({ upload: async () => ({ status: 'processing', jobId: 'job-2' }),
    poll: async () => ({ status: 'processing', jobId: 'job-2' }) });
  await waiting.session.run(); assert.equal(waiting.states.at(-1).phase, 'failed');
  const cancelled = setup({ capture: () => new Promise(() => {}) });
  const promise = cancelled.session.run(); cancelled.session.cancel(); await promise;
  assert.equal(cancelled.states.at(-1).phase, 'cancelled');
  assert.equal(cancelled.states.some(s => s.result), false);
  let resolveUpload;
  const late = setup({ upload: () => new Promise(resolve => { resolveUpload = resolve; }) });
  const latePromise = late.session.run();
  while (!resolveUpload) await new Promise(resolve => setTimeout(resolve, 0));
  late.session.cancel(); resolveUpload(completed); await latePromise;
  assert.equal(late.states.at(-1).phase, 'cancelled');
  const duplicate = setup({ capture: () => new Promise(() => {}) });
  const first = duplicate.session.run(); await duplicate.session.run();
  assert.equal(duplicate.states.length, 1); duplicate.session.cancel(); await first;
  console.log('Measurement tests passed: success, unavailable device, stable retry identity, job reuse, quality failure, server failure, malformed results, timeout, cancellation, late responses and double start.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });

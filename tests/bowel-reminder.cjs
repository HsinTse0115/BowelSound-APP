const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('components/BowelReminder.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

// Exercise component rendering and its real button callback without a native host.
function render(overrides = {}) {
  const state = { patients: [{ id: 'alice', name: 'Alice' }], primaryPatientId: 'alice', ready: true,
    end: '2026-10-20', seen: {}, pathname: '/', ...overrides };
  const pushed = [];
  const saved = [];
  const jsx = (type, props) => ({ type, props });
  const modules = {
    react: { useEffect: () => {}, useState: () => [state.seen, value => { state.seen = value; }] },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { Modal: 'Modal', ScrollView: 'ScrollView', View: 'View' },
    '@react-native-async-storage/async-storage': { __esModule: true, default: { setItem: (key, value) => { saved.push([key, JSON.parse(value)]); return Promise.resolve(); } } },
    'expo-router': { usePathname: () => state.pathname, useRouter: () => ({ push: value => pushed.push(value) }) },
    '@/context/AppContext': { useApp: () => ({ patients: state.patients, settings: { primaryPatientId: state.primaryPatientId } }) },
    '@/context/WellnessContext': { useWellness: () => ({ entries: [], ready: state.ready }) },
    '@/services/wellness': { bowelReminderEnd: () => state.end },
    './consumer-ui': { Button: 'Button', Copy: 'Copy', ui: {}, usePalette: () => ({ card: '#FFFFFF' }) },
    './wellness-ui': { useToday: () => '2026-10-20' },
  };
  const context = { exports: {}, require: name => { if (!(name in modules)) throw new Error(name); return modules[name]; } };
  vm.runInNewContext(code, context);
  return { tree: context.exports.BowelReminder(), pushed, saved };
}
assert.equal(render({ patients: [] }).tree, null);
assert.equal(render({ primaryPatientId: undefined }).tree, null);
assert.equal(render({ primaryPatientId: 'deleted-person' }).tree, null);
assert.equal(render({ ready: false }).tree, null);
assert.equal(render({ seen: null }).tree, null);
assert.equal(render({ end: null }).tree, null);
assert.equal(render({ pathname: '/record' }).tree, null);
assert.equal(render({ seen: { alice: '2026-10-20' } }).tree, null);
function findButton(node, label) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'Button' && node.props.label === label) return node;
  for (const child of [node.props?.children].flat()) {
    const result = findButton(child, label);
    if (result) return result;
  }
}
const active = render();
assert.equal(active.tree.type, 'Modal');
findButton(active.tree, '查看或修正紀錄').props.onPress();
assert.equal(active.pushed[0].params.patientId, 'alice');
assert.equal(active.pushed[0].params.date, '2026-10-20');
assert.equal(active.saved[0][1].alice, '2026-10-20');
console.log('Reminder component tests passed: missing profile, loading, hidden modal, dismissal and calendar navigation.');

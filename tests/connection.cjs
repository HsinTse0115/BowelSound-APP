const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
// Minimal hook host executes the real providers and effect cleanup without a native UI.
let active;
const hosts = [];
const effects = [];
const react = {
  createContext: () => { const context = { value: null }; context.Provider = context; return context; },
  useContext: context => context.value,
  useState: initial => { const host = active, i = host.index++; if (!(i in host.values)) host.values[i] = typeof initial === 'function' ? initial() : initial;
    return [host.values[i], next => { host.values[i] = typeof next === 'function' ? next(host.values[i]) : next; }]; },
  useRef: initial => { const host = active, i = host.index++; return host.values[i] ||= { current: initial }; },
  useCallback: (fn, deps) => { const host = active, i = host.index++; const old = host.values[i]; if (!old || deps.some((d,j) => d !== old.deps[j])) host.values[i] = { fn, deps }; return host.values[i].fn; },
  useEffect: (fn, deps) => { const host = active, i = host.index++; const old = host.values[i]; if (!old || deps.some((d,j) => d !== old.deps[j])) {
    host.values[i] = { deps, cleanup: old?.cleanup }; effects.push(() => { host.values[i].cleanup?.(); host.values[i].cleanup = fn(); });
  } },
};
const jsx = (type, props) => { if (typeof type === 'object') type.value = props.value; return { type, props }; };
const cache = {};
let requests = [];
let responder;
function load(path) {
  if (cache[path]) return cache[path];
  const exports = {}; cache[path] = exports;
  const modules = { react: { ...react, default: react, __esModule: true }, 'react/jsx-runtime': { jsx, jsxs: jsx },
    '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async key => key === '@bowelsound_settings' ? JSON.stringify({ apiUrl: 'http://one' }) : null, setItem: async () => {} } } };
  const requireModule = name => {
    if (modules[name]) return modules[name];
    if (name === './AppContext') return load('context/AppContext.tsx');
    return load((name.startsWith('../') ? name.slice(3) : name.startsWith('@/') ? name.slice(2) : name) + '.ts');
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, require: requireModule, Error, URL, AbortController, setTimeout, clearTimeout, console, fetch: async (url, init) => { requests.push({url,init}); return responder(url,init); } });
  return exports;
}
const app = load('context/AppContext.tsx');
const wellness = load('context/WellnessContext.tsx');
function host(component) { const h = { component, values: [], index: 0 }; hosts.push(h); }
host(app.AppProvider); host(wellness.WellnessProvider);
async function flush() { for (let i=0;i<10;i++) { for (const h of hosts) { active=h; h.index=0; h.component({children:null}); } while (effects.length) effects.shift()(); await new Promise(r=>setImmediate(r)); } }
const person = id => ({ patient_id:id, name:id, age:30, gender:'M', created_at:'2026-01-01' });
const record = (id,caffeine=null) => ({ record_id:id, patient_id:id, duration:20, has_caffeine:caffeine, symptoms:[], created_at:'2026-01-01' });
const day = id => ({ patientId:id, date:'2026-01-01', bowel:'未填寫', feeling:'未填寫', note:'', habits:[], updatedAt:'2026-01-01' });
const response = data => ({ok:true,json:async()=>data});
const standard = url => response(url.endsWith('/patients') ? [person(new URL(url).hostname)] : url.endsWith('/records') ? [record(new URL(url).hostname)] : [day(new URL(url).hostname)]);
(async () => {
  responder = standard; await flush();
  assert.equal(app.useApp().patients[0].id,'one'); assert.equal(wellness.useWellness().entries[0].patientId,'one');
  assert.equal(app.useApp().records[0].hasCaffeine,undefined);
  let body;
  responder = (url,init) => { body=JSON.parse(init.body); return response(record('one',body.has_caffeine)); };
  await app.useApp().updateRecord('one', {hasCaffeine:undefined,symptoms:[]}); await flush();
  assert.equal(body.has_caffeine,null); assert.equal(app.useApp().records[0].hasCaffeine,undefined);
  await app.useApp().updateRecord('one', {hasCaffeine:false,symptoms:['無症狀']}); await flush();
  assert.equal(body.has_caffeine,false); assert.equal(app.useApp().records[0].hasCaffeine,false);
  responder = () => response(record('one', false));
  await assert.rejects(app.useApp().updateRecord('one', {hasCaffeine:undefined}), /未填寫/);
  let finishOld;
  responder = () => new Promise(resolve=>{finishOld=resolve;});
  const oldWrite=app.useApp().updatePatient('one',{name:'old',age:30,gender:'M'});
  const rejected=assert.rejects(oldWrite,/連線設定已變更/);
  await new Promise(r=>setImmediate(r));
  responder=standard; requests=[];
  app.useApp().updateSettings({apiUrl:'http://two'}); await flush();
  assert.equal(app.useApp().patients[0].id,'two'); assert.equal(app.useApp().records[0].id,'two');
  assert.equal(wellness.useWellness().entries[0].patientId,'two');
  assert.equal(requests.filter(r=>r.url.startsWith('http://two/')).length,3);
  finishOld(response(person('one'))); await rejected; await flush();
  assert.equal(app.useApp().patients[0].id,'two','Old writes must not replace new server data');
  const oldResponses=[];
  responder=()=>new Promise(resolve=>oldResponses.push(resolve));
  app.useApp().updateSettings({apiUrl:'http://slow'}); await flush();
  assert.equal(app.useApp().patients.length,0); assert.equal(wellness.useWellness().ready,false); assert.equal(wellness.useWellness().entries.length,0);
  responder=standard; app.useApp().updateSettings({apiUrl:'http://three'}); await flush();
  oldResponses.forEach(resolve=>resolve(response([]))); await flush();
  assert.equal(app.useApp().patients[0].id,'three'); assert.equal(wellness.useWellness().entries[0].patientId,'three');
  responder=url=>url.endsWith('/patients') ? {ok:false,status:503} : standard(url);
  app.useApp().reloadData(); await flush();
  assert.match(app.useApp().storageError,/人員資料/); assert.equal(app.useApp().records[0].id,'three');
  responder=()=>response([null]); app.useApp().reloadData(); await flush();
  assert.match(app.useApp().storageError,/格式/); assert.equal(wellness.useWellness().ready,false); assert.equal(wellness.useWellness().entries.length,0);
  console.log('Provider tests passed: three-resource reload, nullable caffeine, stale reads/writes, loading isolation and partial errors.');
})().catch(error=>{console.error(error);process.exitCode=1;});

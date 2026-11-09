const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const values = [], effects = [];
let index = 0, prevented = false, preventCallback, dirty = false, busy = false;
const dispatched = [], events = new Map();
const navigation = { dispatch: action => { assert.equal(prevented, false, 'Disable guard before replaying navigation'); dispatched.push(action); } };
const modules = {
  react: {
    useState: initial => { const i=index++; if (!(i in values)) values[i]=initial; return [values[i],value=>{values[i]=value;}]; },
    useRef: initial => { const i=index++; return values[i] ||= {current:initial}; },
    useEffect: (fn,deps) => { const i=index++, previous=values[i]; if (!previous || deps.some((value,j)=>value !== previous.deps[j])) {
      values[i]={deps,cleanup:previous?.cleanup}; effects.push(()=>{values[i].cleanup?.(); values[i].cleanup=fn();});
    } },
  },
  'expo-router': { useNavigation:()=>navigation },
  'expo-router/build/react-navigation/native': { usePreventRemove:(value,callback)=>{prevented=value;preventCallback=callback;} },
};
const context={exports:{},require:name=>modules[name],window:{addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('hooks/use-unsaved-changes.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,context);
const render=()=>{index=0;const result=context.exports.useUnsavedChanges(dirty,busy);while(effects.length)effects.shift()();return result;};
let guard=render(); assert.equal(prevented,false); assert.equal(events.size,0);
let local=0; guard.requestDiscard(()=>local++); assert.equal(local,1);
dirty=true; guard=render(); assert.equal(prevented,true); assert.equal(events.has('beforeunload'),true);
let warned=false; const event={preventDefault:()=>{warned=true;}}; events.get('beforeunload')(event); assert.equal(warned,true);
guard.requestDiscard(()=>local++); guard=render(); assert.equal(guard.visible,true); guard.onCancel(); guard=render(); assert.equal(local,1); assert.equal(guard.visible,false);
guard.requestDiscard(()=>{local++;dirty=false;}); guard=render(); guard.onConfirm(); guard=render(); assert.equal(local,2); assert.equal(prevented,false); assert.equal(events.size,0);
dirty=true; guard=render(); preventCallback({data:{action:{type:'GO_BACK'}}}); guard=render(); guard.onCancel(); render(); assert.equal(dispatched.length,0);
busy=true; guard=render(); preventCallback({data:{action:{type:'GO_BACK'}}}); guard=render(); assert.equal(guard.visible,false); guard.requestDiscard(()=>local++); assert.equal(local,2);
busy=false; guard=render(); preventCallback({data:{action:{type:'GO_BACK'}}}); guard=render(); assert.equal(guard.visible,true); guard.onConfirm(); render(); assert.equal(dispatched.length,1); assert.equal(dispatched[0].type,'GO_BACK');
console.log('Unsaved-change tests passed: clean leave, cancel/confirm discard, busy blocking, browser unload and navigation replay.');

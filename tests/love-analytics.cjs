const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const clean = new Function(fs.readFileSync('lib/analyticsValidation.js','utf8').replace('export function','function') + ';return cleanEvent;')();
const id='12345678-1234-4234-8234-123456789012';
const landing=['love_view_landing','love_3sec','love_5sec','love_10sec','love_20sec','love_30sec','love_first_interaction','love_scroll_start','love_scroll_50','love_how_it_works_view','love_hero_cta_click'];
const form=['love_email_form_view','love_email_submit','love_email_submit_success'];
const event=(name,path)=>({id,session_id:id,event_name:name,page_path:path,created_at:new Date().toISOString(),context:{visit_id:id,browser_id:id,version:'homepage-v2.1',device:'mobile',location:'hero',email:'private@example.com'}});
for (const [names,path] of [[landing,'/love'],[form,'/love/early-access']]) for (const name of names) {
 const result=clean(event(name,path)); assert.equal(result.event_name,name); assert.equal(result.context.email,undefined);
 assert.throws(()=>clean(event(name,'/')));
 assert.throws(()=>clean(event(name,path==='/love'?'/love/early-access':'/love')));
}
assert.equal(clean(event('love_hero_cta_click','/love')).context.location,'hero');
function harness(path) {
 const events=[],listeners={},docs={};let now=0,timer,cleanup,observer;
 let rect={width:300,height:40,top:1200,bottom:1240,left:0,right:300};
 const target={getBoundingClientRect:()=>rect};
 const document={visibilityState:'visible',documentElement:{scrollHeight:2000},querySelector:()=>target,addEventListener:(n,f)=>docs[n]=f,removeEventListener:n=>delete docs[n]};
 const window={innerHeight:800,innerWidth:390,scrollY:0,addEventListener:(n,f)=>listeners[n]=f,removeEventListener:n=>delete listeners[n]};
 const sandbox={document,window,performance:{now:()=>now},useRef:value=>({current:value}),useEffect:fn=>cleanup=fn(),trackFunnelEvent:(name,path,user,props)=>events.push({name,path,props}),setInterval:fn=>(timer=fn,1),clearInterval:()=>timer=null,IntersectionObserver:class{constructor(fn){observer=fn;}observe(){}disconnect(){}}};
 vm.runInNewContext(fs.readFileSync('lib/useLoveAnalytics.js','utf8').replace(/^import .*;\r?\n/gm,'').replaceAll('export function','function')+`;useLoveAnalytics('${path}');`,sandbox);
 return {events,listeners,docs,document,window,tick:t=>{now=t;timer?.();},time:t=>now=t,show:()=>{rect={...rect,top:100,bottom:140};observer();},cleanup:()=>{cleanup();assert.equal(Object.keys(listeners).length,0);assert.equal(Object.keys(docs).length,0);}};
}
const b=harness('/love');
assert.deepEqual(b.events.map(e=>e.name),['love_view_landing']);
b.tick(3000);b.time(4000);b.document.visibilityState='hidden';b.docs.visibilitychange();
b.tick(64000);assert(!b.events.some(e=>e.name==='love_5sec'));
b.document.visibilityState='visible';b.docs.visibilitychange();b.tick(65000);
assert(b.events.some(e=>e.name==='love_5sec'));
b.listeners.pointerdown();b.listeners.click();b.listeners.touchstart();b.listeners.keydown();
b.listeners.scroll();assert(!b.events.some(e=>e.name==='love_scroll_start'));
b.window.scrollY=1;b.listeners.scroll();assert(!b.events.some(e=>e.name==='love_scroll_50'));
b.window.scrollY=600;b.listeners.scroll();b.listeners.scroll();b.show();b.show();b.tick(90000);b.tick(91000);
for(const name of landing.filter(n=>n!=='love_hero_cta_click')) assert.equal(b.events.filter(e=>e.name===name).length,1,name);
b.cleanup();
const f=harness('/love/early-access');assert.equal(f.events.length,0);
f.document.visibilityState='hidden';f.show();assert.equal(f.events.length,0);
f.document.visibilityState='visible';f.docs.visibilitychange();f.show();
assert.deepEqual(f.events.map(e=>e.name),['love_email_form_view']);f.cleanup();
console.log('All 14 event routes, privacy filtering, visible attention, interactions, scroll thresholds, actual element views, deduplication and cleanup passed.');

// Execute the page's submit handler against successful and failed API responses.
const page=fs.readFileSync('pages/love/early-access.js','utf8');
const joinSource=page.slice(page.indexOf('  async function join('),page.indexOf('\n  return <div'));
async function submit(response,status='idle') {
 const events=[];
 const sandbox={status,email:'test@example.com',AbortController,TypeError,setTimeout,clearTimeout,trackLoveEvent:name=>events.push(name),setStatus:value=>sandbox.status=value,setError:value=>sandbox.error=value,fetch:async()=>response};
 vm.runInNewContext(joinSource,sandbox);await sandbox.join({preventDefault(){}});return {events,status:sandbox.status};
}
(async()=>{
 assert.deepEqual((await submit({ok:true,json:async()=>({joined:true})})).events,['love_email_submit','love_email_submit_success']);
 for(const response of [{ok:false,json:async()=>({error:'Unavailable'})},{ok:true,json:async()=>({})}]) {
  const result=await submit(response);assert.deepEqual(result.events,['love_email_submit']);assert.equal(result.status,'idle');
 }
 assert.deepEqual((await submit(null,'loading')).events,[]);
 console.log('Submit attempts, confirmed-save-only success, API failures and in-flight repeat protection passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const source=fs.readFileSync('lib/funnel.js','utf8').replace(/^import .*;\r?\n/gm,'').replaceAll('export async function','async function');
function browser(storage=new Map(),search='',blocked=false){
  const legacy=[];
  const sandbox={URLSearchParams,Date,console,crypto:{randomUUID},innerWidth:390,location:{search},process:{env:{NODE_ENV:'production'}},localStorage:{getItem:k=>{if(blocked)throw Error();return storage.get(k)||null;},setItem:(k,v)=>{if(blocked)throw Error();storage.set(k,v);}},window:{addEventListener(){}},document:{addEventListener(){}},setInterval(){},fetch:async()=>({ok:false}),supabase:{from:()=>({insert:async e=>{legacy.push(e);return {error:null};}})}};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  return {sandbox,storage,legacy,track:(name,path='/',props={})=>sandbox.trackFunnelEvent(name,path,null,props),queue:()=>JSON.parse(vm.runInContext('read(KEY)',sandbox)||'[]')};
}
(async()=>{
 const storage=new Map();let b=browser(storage);
 await b.track('homepage_3sec');assert.equal(b.queue().at(-1).context.internal,false);
 const session=storage.get('mm_session_id'),visit=JSON.parse(storage.get('mm_visit')).id;
 b.sandbox.location.search='?internal=1';await b.track('homepage_5sec');
 assert.equal(storage.get('mindmirror_internal_user'),'1');assert.equal(b.queue().at(-1).context.internal,true);
 assert.equal(storage.get('mm_session_id'),session);assert.equal(JSON.parse(storage.get('mm_visit')).id,visit);
 b=browser(storage); // Fresh JS runtime, shared persistent browser storage.
 for(const [name,path] of [['homepage_10sec','/'],['view_auth','/auth'],['view_profile','/profile']]){await b.track(name,path,{internal:false});assert.equal(b.queue().at(-1).context.internal,true);}
 await b.track('legacy_test','/existing-funnel-route');assert.equal(b.legacy[0].context.internal,true);assert.equal(b.legacy[0].session_id,session);
 b.sandbox.location.search='?internal=0';await b.track('homepage_20sec');assert.equal(b.queue().at(-1).context.internal,false);
 b=browser(storage);await b.track('homepage_30sec');assert.equal(b.queue().at(-1).context.internal,false);
 await b.track('legacy_test','/existing-funnel-route');assert.equal(b.legacy[0].context.internal,false);
 assert.equal(storage.get('mm_session_id'),session);assert.equal(JSON.parse(storage.get('mm_visit')).id,visit);
 b=browser(new Map([['mm_internal','1']]));await b.track('homepage_3sec');assert.equal(b.queue()[0].context.internal,true);
 b.sandbox.location.search='?internal=0&analytics_test=1';await b.track('homepage_5sec');assert.equal(b.queue().at(-1).context.internal,false);
 b=browser(new Map(),'?analytics_test=1');await b.track('homepage_3sec');assert.equal(b.queue()[0].context.internal,true);
 b=browser(new Map(),'?internal=1',true);await b.track('homepage_3sec');b.sandbox.location.search='';await b.track('homepage_5sec');assert.equal(b.queue().at(-1).context.internal,true);
 console.log('Internal flag: persistence, clear, legacy migration, all transport paths, stable IDs, override protection and blocked-storage fallback passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});

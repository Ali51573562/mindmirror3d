const assert = require('node:assert/strict');
const fs = require('node:fs');
function load(file, name){return new Function(fs.readFileSync(file,'utf8').replaceAll('export function','function')+`;return ${name}`)();}
const clean=load('lib/analyticsValidation.js','cleanEvent');
const summary=load('lib/analyticsSummary.js','summarizeAnalytics');
const id='12345678-1234-4234-8234-123456789012';
const base={id,session_id:id,page_path:'/',event_name:'view_homepage',created_at:new Date().toISOString(),context:{visit_id:id,browser_id:id,version:'homepage-v2.1',device:'mobile',internal:true,campaign:{utm_source:'test'},email:'must not persist',answers:[1,2]}};
assert.equal(clean(base).context.email,undefined);assert.equal(clean(base).context.answers,undefined);
assert.throws(()=>clean({...base,page_path:'/results'}));assert.throws(()=>clean({...base,event_name:'assessment_results'}));
const make=(name,props={})=>({...base,event_name:name,context:{...base.context,...props}});
const report=summary([make('view_homepage'),make('start_journey_click',{location:'how'}),make('start_journey_click',{location:'how'}),make('homepage_active_time',{seconds:10}),make('view_profile'),make('guidebook_page_view',{page:8}),make('guidebook_page_view',{page:8})]);
assert.equal(report.totals.visits,1);assert.equal(report.totals.engagedClicked,1);assert.equal(report.buttons.how,1);assert.equal(report.pages[8],1);assert.equal(report.depth['Pages 5–9'],1);
console.log('Validation, privacy allowlist and unique-visit metrics passed.');

// New homepage events must survive ingestion and appear once per visit in reports.
const attentionEvents=['homepage_3sec','homepage_5sec','homepage_10sec','homepage_20sec','homepage_30sec','homepage_first_interaction','homepage_scroll_start','hero_image_visible','hero_see_my_free_preview_click'];
for(const name of attentionEvents) assert.equal(clean(make(name)).event_name,name);
const attentionReport=summary([make('view_homepage'),...attentionEvents.flatMap(name=>[make(name),make(name)])]);
for(const name of attentionEvents) assert.equal(attentionReport.attention[name],1);
assert.equal(attentionReport.totals.clicked,1);
assert.equal(attentionReport.buttons.hero,1);

// Exercise the real hook with a controlled clock, visibility, image load and events.
const vm=require('node:vm');
const events=[],listeners={},docListeners={},imageListeners={};
let now=0,timer,cleanup;
const img={complete:false,naturalWidth:0,getBoundingClientRect:()=>({width:200,height:300,top:0,bottom:300,left:0,right:200}),addEventListener:(n,f)=>imageListeners[n]=f,removeEventListener:n=>delete imageListeners[n]};
const document={visibilityState:'visible',documentElement:{scrollHeight:2000},addEventListener:(n,f)=>docListeners[n]=f,removeEventListener:n=>delete docListeners[n],querySelectorAll:s=>s==='[data-analytics-hero-image]'?[img]:[]};
const window={scrollY:0,addEventListener:(n,f)=>listeners[n]=f,removeEventListener:n=>delete listeners[n]};
const sandbox={document,window,innerWidth:390,innerHeight:844,performance:{now:()=>now},useRef:value=>({current:value}),useEffect:fn=>cleanup=fn(),trackFunnelEvent:name=>events.push(name),setInterval:fn=>(timer=fn,1),clearInterval:()=>{},IntersectionObserver:class{observe(){}disconnect(){}}};
vm.runInNewContext(fs.readFileSync('lib/useHomepageAnalytics.js','utf8').replace(/^import .*;\r?\n/gm,'').replace('export function','function')+'\nuseHomepageAnalytics();',sandbox);
assert(!events.includes('hero_image_visible'));
now=3000;timer();assert(events.includes('homepage_3sec'));assert(!events.includes('homepage_5sec'));
now=4000;document.visibilityState='hidden';docListeners.visibilitychange();
now=64000;timer();assert(!events.includes('homepage_5sec'));
document.visibilityState='visible';docListeners.visibilitychange();
now=65000;timer();assert(events.includes('homepage_5sec'));
img.complete=true;img.naturalWidth=941;imageListeners.load();imageListeners.load();
listeners.pointerdown();listeners.click();listeners.keydown();listeners.scroll();listeners.scroll();
now=90000;timer();timer();
for(const name of attentionEvents.filter(n=>n!=='hero_see_my_free_preview_click')) assert.equal(events.filter(e=>e===name).length,1,name);
cleanup();assert.equal(Object.keys(listeners).length,0);assert.equal(Object.keys(docListeners).length,0);assert.equal(Object.keys(imageListeners).length,0);
console.log('Attention timers, hidden-tab exclusion, image loading, deduplication, cleanup and reporting passed.');

// Keep historical preview clicks and the renamed event in preview metrics;
// gift interest is separate from preview conversion.
for (const name of ['hero_free_preview_click','hero_buy_as_gift_click']) assert.equal(clean(make(name)).event_name,name);
const giftOnly=summary([make('view_homepage'),make('hero_buy_as_gift_click')]);
assert.equal(giftOnly.totals.clicked,0);
assert.equal(giftOnly.attention.hero_buy_as_gift_click,1);
const renamedPreview=summary([make('view_homepage'),make('hero_free_preview_click'),make('hero_free_preview_click')]);
assert.equal(renamedPreview.totals.clicked,1);
assert.equal(renamedPreview.buttons.hero,1);
assert.equal(renamedPreview.attention.hero_free_preview_click,1);

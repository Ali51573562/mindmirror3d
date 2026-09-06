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

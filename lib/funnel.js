import { supabase } from './supabaseClient';
const VERSION = 'homepage-v2.1';
const KEY = 'mm_analytics_queue';
const INTERNAL_KEY = 'mindmirror_internal_user';
let memory = {}, flushing = false, initialized = false;
const seen = new Set();
function read(key) { try { return localStorage.getItem(key) || memory[key]; } catch { return memory[key]; } }
function write(key,value) { memory[key]=value;try { localStorage.setItem(key,value); } catch {} }
function uuid() {
  if(typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const a=crypto.getRandomValues(new Uint8Array(16));a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;
  const h=Array.from(a,b=>b.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
function parse(value, fallback) {try{return JSON.parse(value)||fallback;}catch{return fallback;}}
function isInternal() {
  const params = new URLSearchParams(location.search);
  const requested = params.get('internal') ?? params.get('analytics_test');
  if (requested === '1' || requested === '0') {
    write(INTERNAL_KEY, requested);
    // Keep previously bookmarked test URLs compatible, including explicit clearing.
    write('mm_internal', requested);
  } else if (read(INTERNAL_KEY) === undefined || read(INTERNAL_KEY) === null) {
    if (read('mm_internal') === '1') write(INTERNAL_KEY, '1');
  }
  return process.env.NODE_ENV !== 'production' || read(INTERNAL_KEY) === '1';
}
function context() {
  let browser=read('mm_session_id');if(!browser){browser=uuid();write('mm_session_id',browser);}
  const now=Date.now();let visit=parse(read('mm_visit'),null);
  if(!visit || now-visit.last>30*60*1000){
    const params=new URLSearchParams(location.search);const campaign={};
    for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']) {const v=params.get(key);if(v)campaign[key]=v.slice(0,120);}
    visit={id:uuid(),last:now,campaign};
  }
  visit.last=now;write('mm_visit',JSON.stringify(visit));
  return {browser_id:browser,visit_id:visit.id,version:VERSION,device:innerWidth<768?'mobile':innerWidth<1024?'tablet':'desktop',internal:isInternal(),campaign:visit.campaign};
}
function queue() {return parse(read(KEY),[]).filter(e=>Date.now()-Date.parse(e.created_at)<86400000).slice(-200);}
export async function flushAnalytics() {
  if(flushing || typeof window==='undefined')return;
  const batch=queue().slice(0,20);if(!batch.length)return;flushing=true;
  try {
    const response=await fetch('/api/analytics/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({events:batch}),keepalive:true});
    if(response.ok){const ids=new Set(batch.map(e=>e.id));write(KEY,JSON.stringify(queue().filter(e=>!ids.has(e.id))));}
  } catch { /* Keep event IDs stable for a later idempotent retry. */ }
  finally {flushing=false;}
}
function init() {
  if(initialized)return;initialized=true;
  setInterval(flushAnalytics,5000);window.addEventListener('online',flushAnalytics);
  window.addEventListener('pagehide',flushAnalytics);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushAnalytics();});
}
export async function trackFunnelEvent(eventName,pagePath,userId=null,properties={},once=null) {
  if(typeof window==='undefined')return;
  try {
    const ctx=context();
    // Retain legacy behavior outside the marketing-to-profile funnel.
    if(!['/','/profile','/auth','/love','/love/early-access'].includes(pagePath)){
      const {error}=await supabase.from('funnel_events').insert({session_id:ctx.browser_id,user_id:userId,event_name:eventName,page_path:pagePath,context:{internal:ctx.internal}});
      if(error)console.warn('Funnel event could not be stored');return;
    }
    const token=`${ctx.visit_id}:${once || (['view_homepage','view_profile','view_auth'].includes(eventName)?eventName:'')}`;
    if((once || eventName.startsWith('view_'))&&seen.has(token))return;
    if(once || eventName.startsWith('view_'))seen.add(token);
    const entry={id:uuid(),session_id:ctx.browser_id,event_name:eventName,page_path:pagePath,created_at:new Date().toISOString(),context:{...ctx,...properties,internal:ctx.internal}};
    write(KEY,JSON.stringify([...queue(),entry].slice(-200)));init();void flushAnalytics();
  } catch { console.warn('Analytics unavailable in this browser'); }
}

const names = new Set(['view_homepage','view_profile','view_auth','homepage_10sec','homepage_30sec','homepage_scroll_50','start_journey_click','hero_see_how_it_works_click','homepage_active_time','homepage_section_view','how_it_works_card_view','how_it_works_card_interaction','tap_sculpture_hotspot','guidebook_preview_interaction','guidebook_page_view','unboxing_video_play','unboxing_video_progress']);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
for (const name of ['homepage_3sec','homepage_5sec','homepage_20sec','homepage_first_interaction','homepage_scroll_start','hero_see_my_free_preview_click','hero_image_visible']) names.add(name);
export function cleanEvent(e) {
  if(!e || !uuid.test(e.id) || !uuid.test(e.session_id) || !names.has(e.event_name) || !['/','/profile','/auth'].includes(e.page_path))throw Error('Invalid event');
  if(e.page_path!=='/' && e.event_name!==({'/profile':'view_profile','/auth':'view_auth'}[e.page_path]))throw Error('Invalid route');
  const c=e.context;
  if(!c || !uuid.test(c.visit_id) || c.browser_id!==e.session_id || c.version!=='homepage-v2.1' || !['mobile','tablet','desktop'].includes(c.device))throw Error('Invalid context');
  const context={visit_id:c.visit_id,browser_id:e.session_id,version:c.version,device:c.device,internal:c.internal===true,campaign:{}};
  for(const k of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'])if(typeof c.campaign?.[k]==='string')context.campaign[k]=c.campaign[k].slice(0,120);
  const enums={section:['hero','how','example','explore','guidebook','video','final'],location:['how','guidebook','final'],symbol:['Cloud head','Heart body','Puzzle hands','Butterfly wings'],action:['turn','enlarge','zoom_turn','text_open'],mode:['inline','enlarged'],direction:['next','previous']};
  for(const [key,values] of Object.entries(enums))if(values.includes(c[key]))context[key]=c[key];
  for(const [key,min,max] of [['card',1,4],['page',1,15],['seconds',1,120],['percent',25,100]])if(Number.isInteger(c[key])&&c[key]>=min&&c[key]<=max)context[key]=c[key];
  const time=Date.parse(e.created_at);if(!Number.isFinite(time)||time>Date.now()+300000||time<Date.now()-86400000)throw Error('Invalid timestamp');
  return {id:e.id,session_id:e.session_id,event_name:e.event_name,page_path:e.page_path,created_at:new Date(time).toISOString(),context};
}

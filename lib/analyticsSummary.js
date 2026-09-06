export function summarizeAnalytics(events) {
  const visits=new Map();
  for(const e of events){const c=e.context;if(!c?.visit_id)continue;if(!visits.has(c.visit_id))visits.set(c.visit_id,[]);visits.get(c.visit_id).push(e);}
  const totals={visits:0,engaged:0,clicked:0,engagedClicked:0,profile:0};
  const sections={},symbols={},pages={},buttons={},video={},cards={},segments={},depth={};
  const increment=(obj,key)=>{obj[key]=(obj[key]||0)+1;};
  for(const rows of visits.values()){
    rows.sort((a,b)=>a.created_at.localeCompare(b.created_at));
    const home=rows.find(e=>e.event_name==='view_homepage');if(!home)continue;
    totals.visits++;
    const engaged=rows.some(e=>e.event_name==='homepage_active_time'&&e.context.seconds>=10);
    const clicked=rows.some(e=>e.event_name==='start_journey_click');
    if(engaged)totals.engaged++;if(clicked)totals.clicked++;if(engaged&&clicked)totals.engagedClicked++;
    if(rows.some(e=>e.event_name==='view_profile'&&e.created_at>=home.created_at))totals.profile++;
    const unique={sections:new Set(),symbols:new Set(),pages:new Set(),buttons:new Set(),video:new Set(),cards:new Set()};let furthest=0;
    for(const e of rows){const c=e.context;
      if(e.event_name==='homepage_section_view')unique.sections.add(c.section);
      if(e.event_name==='tap_sculpture_hotspot')unique.symbols.add(c.symbol);
      if(e.event_name==='guidebook_page_view'){unique.pages.add(c.page);furthest=Math.max(furthest,c.page||0);}
      if(e.event_name==='start_journey_click')unique.buttons.add(c.location);
      if(e.event_name==='unboxing_video_play')unique.video.add('Started');
      if(e.event_name==='unboxing_video_progress')unique.video.add(`${c.percent}% watched`);
      if(e.event_name==='how_it_works_card_view')unique.cards.add(c.card);
    }
    for(const [key,obj] of Object.entries({sections,symbols,pages,buttons,video,cards}))for(const value of unique[key])if(value!==undefined)increment(obj,value);
    increment(depth,furthest===0?'Not opened':furthest<5?'Pages 1–4':furthest<10?'Pages 5–9':'Pages 10–15');
    const c=home.context;
    for(const [dimension,value] of [['device',c.device],['version',c.version],['campaign',c.campaign?.utm_campaign||'(untagged)']]){
      const key=`${dimension}: ${value}`;segments[key] ||= {visits:0,clicked:0,profile:0};segments[key].visits++;if(clicked)segments[key].clicked++;
      if(rows.some(e=>e.event_name==='view_profile'))segments[key].profile++;
    }
  }
  return {totals,sections,symbols,pages,buttons,video,cards,segments,depth};
}

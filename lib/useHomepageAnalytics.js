import { useEffect } from 'react';
import { trackFunnelEvent } from './funnel';

export function useHomepageAnalytics() {
  useEffect(() => {
    const send = (name, properties = {}, once) => trackFunnelEvent(name, '/', null, properties, once);
    send('view_homepage', {}, 'homepage');
    const t10 = setTimeout(() => send('homepage_10sec', {}, 'elapsed10'), 10000);
    const t30 = setTimeout(() => send('homepage_30sec', {}, 'elapsed30'), 30000);
    let active = 0, previous = performance.now(), activeKey;
    try {
      activeKey = `mm_active_${JSON.parse(localStorage.getItem('mm_visit')).id}`;
      active = Number(sessionStorage.getItem(activeKey)) || 0;
    } catch { /* In-memory measurement still works when storage is blocked. */ }
    const tick = () => {
      const now = performance.now();
      if (document.visibilityState === 'visible') active += Math.min(now - previous, 1500);
      previous = now;
      try { if (activeKey) sessionStorage.setItem(activeKey, String(active)); } catch {}
      for (const seconds of [10,30,60,120]) if (active >= seconds*1000) send('homepage_active_time', { seconds }, `active${seconds}`);
    };
    const interval = setInterval(tick, 1000);
    const visibility = () => { previous = performance.now(); };
    document.addEventListener('visibilitychange', visibility);
    const scroll = () => { if (window.scrollY + innerHeight >= document.documentElement.scrollHeight*.5) send('homepage_scroll_50', {}, 'scroll50'); };
    window.addEventListener('scroll', scroll, { passive:true });
    // Observe the heading/entry of a section rather than demanding half of a tall section.
    const observer = new IntersectionObserver(entries => {
      if (document.visibilityState !== 'visible') return;
      entries.forEach(({target,isIntersecting,intersectionRatio}) => {
        if (isIntersecting && intersectionRatio >= .5) {
          const section = target.closest('[data-analytics-section]')?.dataset.analyticsSection;
          const card = target.dataset.analyticsCard;
          if (card) send('how_it_works_card_view', {card:Number(card)}, `card${card}`);
          else if(section) send('homepage_section_view', {section}, `section${section}`);
        }
      });
    }, {threshold:[.5]});
    document.querySelectorAll('[data-analytics-section]').forEach(el => observer.observe(el.querySelector('h1,h2') || el));
    document.querySelectorAll('[data-analytics-card]').forEach(el => observer.observe(el));
    return () => { clearTimeout(t10);clearTimeout(t30);clearInterval(interval);observer.disconnect();window.removeEventListener('scroll',scroll);document.removeEventListener('visibilitychange',visibility); };
  }, []);
}

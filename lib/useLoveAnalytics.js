import { useEffect, useRef } from 'react';
import { trackFunnelEvent } from './funnel';

export function trackLoveEvent(name, path, properties = {}) {
  void trackFunnelEvent(name, path, null, properties);
}

// Once per page mount (including React Strict Mode effect replays), not per visit.
export function useLoveAnalytics(path) {
  const sent = useRef(new Set());
  const active = useRef(0);
  useEffect(() => {
    const landing = path === '/love';
    const once = name => {
      if (sent.current.has(name)) return;
      sent.current.add(name);
      trackLoveEvent(name, path);
    };
    const checkView = () => {
      if (document.visibilityState !== 'visible') return;
      const target = document.querySelector(landing ? '#love-how-title' : '#love-email');
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      if (rect.width > 0 && rect.height > 0 && visibleHeight >= rect.height * .5 && rect.right > 0 && rect.left < window.innerWidth) {
        once(landing ? 'love_how_it_works_view' : 'love_email_form_view');
      }
    };
    if (landing) once('love_view_landing');
    let previous = performance.now();
    let visible = document.visibilityState === 'visible';
    const tick = () => {
      const now = performance.now();
      if (visible && landing) active.current += now - previous;
      previous = now;
      if (landing) for (const seconds of [3, 5, 10, 20, 30]) {
        if (active.current >= seconds * 1000) once(`love_${seconds}sec`);
      }
    };
    const visibility = () => { tick(); visible = document.visibilityState === 'visible'; checkView(); };
    const interaction = () => {
      if (landing && document.visibilityState === 'visible') once('love_first_interaction');
    };
    let previousScroll = window.scrollY;
    const scroll = () => {
      const moved = window.scrollY !== previousScroll;
      previousScroll = window.scrollY;
      if (document.visibilityState !== 'visible') return;
      if (landing && moved) {
        interaction();
        once('love_scroll_start');
        // Half of the scrollable distance; no automatic hit on short pages.
        const distance = document.documentElement.scrollHeight - window.innerHeight;
        if (distance > 0 && window.scrollY >= distance * .5) once('love_scroll_50');
      }
      checkView();
    };
    const inputs = ['pointerdown', 'click', 'touchstart', 'keydown'];
    if (landing) inputs.forEach(name => window.addEventListener(name, interaction, { passive: true }));
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', checkView);
    document.addEventListener('visibilitychange', visibility);
    const timer = landing ? setInterval(tick, 250) : null;
    const observer = new IntersectionObserver(checkView, { threshold: [.5] });
    const target = document.querySelector(landing ? '#love-how-title' : '#love-email');
    if (target) observer.observe(target);
    checkView();
    return () => {
      if (timer !== null) clearInterval(timer);
      observer.disconnect();
      inputs.forEach(name => window.removeEventListener(name, interaction));
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('resize', checkView);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [path]);
}

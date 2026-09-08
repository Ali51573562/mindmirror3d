import { useEffect, useRef } from 'react';
import { trackFunnelEvent } from './funnel';

export function useHomepageAnalytics() {
  const sent = useRef(new Set());
  useEffect(() => {
    const send = (name, properties = {}, once) => trackFunnelEvent(name, '/', null, properties, once);
    const attention = (name) => {
      if (sent.current.has(name)) return;
      sent.current.add(name);
      send(name);
    };
    send('view_homepage', {}, 'homepage');
    let active = 0, previous = performance.now();
    let visible = document.visibilityState === 'visible';
    const tick = () => {
      const now = performance.now();
      if (visible) active += now - previous;
      previous = now;
      for (const seconds of [3, 5, 10, 20, 30]) {
        if (active >= seconds * 1000) attention(`homepage_${seconds}sec`);
      }
      for (const seconds of [10, 30, 60, 120]) {
        if (active >= seconds * 1000) send('homepage_active_time', { seconds }, `active${seconds}`);
      }
    };
    const interval = setInterval(tick, 250);
    const images = [...document.querySelectorAll('[data-analytics-hero-image]')];
    const checkImages = () => {
      if (document.visibilityState !== 'visible') return;
      for (const img of images) {
        const rect = img.getBoundingClientRect();
        if (img.complete && img.naturalWidth > 0 && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth) {
          attention('hero_image_visible');
        }
      }
    };
    const visibility = () => {
      tick();
      visible = document.visibilityState === 'visible';
      checkImages();
    };
    document.addEventListener('visibilitychange', visibility);
    const interaction = () => {
      if (document.visibilityState === 'visible') attention('homepage_first_interaction');
    };
    const interactions = ['pointerdown', 'click', 'touchstart', 'keydown'];
    interactions.forEach(name => window.addEventListener(name, interaction, { passive: true }));
    const scroll = () => {
      if (document.visibilityState !== 'visible') return;
      interaction();
      attention('homepage_scroll_start');
      if (window.scrollY + innerHeight >= document.documentElement.scrollHeight * .5) send('homepage_scroll_50', {}, 'scroll50');
    };
    window.addEventListener('scroll', scroll, { passive: true, capture: true });
    const imageObserver = new IntersectionObserver(checkImages);
    images.forEach(img => { imageObserver.observe(img); img.addEventListener('load', checkImages); });
    window.addEventListener('resize', checkImages);
    checkImages();
    // Observe the heading/entry of a section rather than half of a tall section.
    const observer = new IntersectionObserver(entries => {
      if (document.visibilityState !== 'visible') return;
      entries.forEach(({ target, isIntersecting, intersectionRatio }) => {
        if (isIntersecting && intersectionRatio >= .5) {
          const section = target.closest('[data-analytics-section]')?.dataset.analyticsSection;
          const card = target.dataset.analyticsCard;
          if (card) send('how_it_works_card_view', { card: Number(card) }, `card${card}`);
          else if (section) send('homepage_section_view', { section }, `section${section}`);
        }
      });
    }, { threshold: [.5] });
    document.querySelectorAll('[data-analytics-section]').forEach(el => {
      const headings = el.querySelectorAll('h1,h2');
      if (headings.length) headings.forEach(heading => observer.observe(heading));
      else observer.observe(el);
    });
    document.querySelectorAll('[data-analytics-card]').forEach(el => observer.observe(el));
    return () => {
      clearInterval(interval);
      observer.disconnect();
      imageObserver.disconnect();
      images.forEach(img => img.removeEventListener('load', checkImages));
      interactions.forEach(name => window.removeEventListener(name, interaction));
      window.removeEventListener('scroll', scroll, true);
      window.removeEventListener('resize', checkImages);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
}

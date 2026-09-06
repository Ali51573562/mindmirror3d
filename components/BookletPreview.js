import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Expand, X } from 'lucide-react';
import sourcePages from './bookletPages.json';
import { trackFunnelEvent } from '../lib/funnel';
import s from '../styles/BookletPreview.module.css';

// Omit the blank inside cover from the web reader; preserve the source booklet.
const pages = sourcePages.filter((_, index) => index !== 1);

export default function BookletPreview() {
  const [page, setPage] = useState(0);
  const [wide, setWide] = useState(false);
  const [turn, setTurn] = useState(null);
  const [zoom, setZoom] = useState(0);
  const timer = useRef(null);
  const touch = useRef(null);
  const dialog = useRef(null);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 760px)');
    const resize = () => { setWide(query.matches); setPage(p => query.matches && p > 0 && p % 2 === 0 ? p - 1 : p); setTurn(null); };
    resize(); query.addEventListener('change', resize);
    return () => { query.removeEventListener('change', resize); clearTimeout(timer.current); };
  }, []);
  const spread = wide && page > 0 && page < pages.length - 1;
  const visible = spread ? [page, page + 1] : [page];
  const last = visible[visible.length - 1];
  const reader = useRef(null);
  const viewed = useRef(new Set());
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || document.visibilityState !== 'visible') return;
        const index = Number(entry.target.dataset.bookletPage);
        const mode = entry.target.dataset.bookletMode;
        const key = `${mode}:${index}`;
        if (!viewed.current.has(key)) {
          viewed.current.add(key);
          trackFunnelEvent('guidebook_page_view','/',null,{page:index+1,mode});
        }
      });
    }, {threshold:.1});
    reader.current?.querySelectorAll('[data-booklet-page]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [page, wide, zoom]);
  function changeZoom(index) {
    setZoom(index);
    trackFunnelEvent('guidebook_preview_interaction','/',null,{action:'zoom_turn',page:index+1,mode:'enlarged'});
  }
  function flip(direction) {
    if (turn || (direction < 0 && page === 0) || (direction > 0 && last === pages.length - 1)) return;
    const next = direction > 0 ? last + 1 : Math.max(0, page - (wide ? 2 : 1));
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTurn({ index: direction > 0 ? last : page, direction });
      timer.current = setTimeout(() => setTurn(null), 600);
    }
    setPage(next);
    trackFunnelEvent('guidebook_preview_interaction', '/', null, {action:'turn',page:next+1,direction:direction>0?'next':'previous',mode:'inline'});
  }
  function keys(event) {
    if (dialog.current?.open) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); flip(event.key === 'ArrowRight' ? 1 : -1);
    }
  }
  function enlarge(index) {
    setZoom(index); dialog.current.showModal();
    trackFunnelEvent('guidebook_preview_interaction', '/', null, {action:'enlarge',page:index+1,mode:'enlarged'});
  }
  return <div ref={reader} className={s.reader} role="region" aria-label="MindMirror guidebook reader" onKeyDown={keys}>
    <p className={s.hint}>Turn the pages. Explore the story behind one sculpture.</p>
    <div className={s.stage} tabIndex={0} aria-label="Booklet pages. Use left and right arrow keys to turn pages."
      onTouchStart={e => { if(e.touches.length === 1) touch.current = { x:e.touches[0].clientX, y:e.touches[0].clientY }; else touch.current = null; }}
      onTouchEnd={e => { const start = touch.current; touch.current = null; if (!start) return; const dx = e.changedTouches[0].clientX - start.x; const dy = e.changedTouches[0].clientY - start.y; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)*1.5) flip(dx < 0 ? 1 : -1); }}>
      <div className={`${s.book} ${spread ? s.spread : ''}`}>
        {visible.map((index) => <button key={index} data-booklet-page={index} data-booklet-mode="inline" className={s.paper} onClick={() => enlarge(index)} aria-label={`Enlarge booklet page ${index + 1}`}>
          <img src={pages[index].src} width={pages[index].width} height={pages[index].height} alt={`MindMirror guidebook, page ${index + 1}`} loading="lazy" draggable="false"/>
          <span className={s.enlarge}><Expand size={16} aria-hidden="true"/> Enlarge</span>
        </button>)}
        {turn && <div aria-hidden="true" className={`${s.turning} ${turn.direction > 0 ? s.forward : s.backward}`}><img src={pages[turn.index].src} alt=""/></div>}
      </div>
    </div>
    <div className={s.controls}>
      <button onClick={() => flip(-1)} disabled={page === 0 || !!turn} aria-label="Previous booklet page"><ArrowLeft size={20}/><span>Previous</span></button>
      <p aria-live="polite" aria-atomic="true">{spread ? `Preview pages ${page+1}–${last+1}` : `Preview page ${page+1}`} <span>of {pages.length}</span></p>
      <button onClick={() => flip(1)} disabled={last === pages.length-1 || !!turn} aria-label="Next booklet page"><span>Next</span><ArrowRight size={20}/></button>
    </div>
    <p className={s.hint}>Swipe or use the arrows · Tap a page to read it larger</p>
    <dialog ref={dialog} className={s.dialog} aria-label="Enlarged booklet page" onClick={e => { if(e.target === dialog.current) dialog.current.close(); }}>
      <div className={s.zoomToolbar}><button onClick={() => changeZoom(zoom-1)} disabled={zoom === 0} aria-label="Previous enlarged page"><ArrowLeft size={20}/></button><span>Preview page {zoom+1} of {pages.length}</span><button onClick={() => changeZoom(zoom+1)} disabled={zoom === pages.length-1} aria-label="Next enlarged page"><ArrowRight size={20}/></button><button onClick={() => dialog.current.close()} aria-label="Close enlarged booklet"><X size={22}/></button></div>
      <div className={s.zoomScroll}><img data-booklet-page={zoom} data-booklet-mode="enlarged" src={pages[zoom].src} width={pages[zoom].width} height={pages[zoom].height} alt={`Enlarged MindMirror guidebook page ${zoom+1}`}/></div>
    </dialog>
  </div>;
}

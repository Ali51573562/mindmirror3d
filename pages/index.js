import Head from 'next/head';
import { useHomepageAnalytics } from '../lib/useHomepageAnalytics';
import BookletPreview from '../components/BookletPreview';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowLeft, Play, Menu, X, Sparkles, BookOpen, Fingerprint, Package, Gift } from 'lucide-react';
import { trackFunnelEvent } from '../lib/funnel';
import s from '../styles/Home.module.css';

const steps = [
  ['Take the self-discovery test', 'Answer guided questions about your traits, needs, and inner patterns.', Fingerprint],
  ['See your result preview', 'Get a first glimpse before ordering.', Sparkles],
  ['We create your sculpture', 'Your results guide the form and symbolism.', Package],
  ['Receive sculpture + guidebook', 'The guidebook explains what your MindMirror reflects.', BookOpen],
];
const symbols = [
  { name: 'Cloud head', text: 'An imaginative mind, open to new ideas and perspectives.', x: 50, y: 8 },
  { name: 'Heart body', text: 'A need for love, care, and emotional connection.', x: 51, y: 38 },
  { name: 'Puzzle hands', text: 'A desire to belong, be understood, and contribute.', x: 48, y: 25 },
  { name: 'Butterfly wings', text: 'A desire for freedom, transformation, and growth.', x: 72, y: 20 },
];
const track = (event, properties = {}, once) => trackFunnelEvent(event, '/', null, properties, once);
function PreviewLink({ children, location }) {
  return <Link href="/profile" className={s.button} onClick={() => track('start_journey_click', {location})}>{children}<ArrowRight size={18} aria-hidden="true" /></Link>;
}
function Carousel({ items, label, event, render }) {
  const rail = useRef(null);
  const [active, setActive] = useState(0);
  const interacted = useRef(false);
  function go(index) {
    const next = Math.max(0, Math.min(items.length - 1, index));
    const el = rail.current;
    el.scrollTo({ left: el.children[next].offsetLeft - el.children[0].offsetLeft, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    track(event, {card: next+1});
  }
  function onScroll() {
    const el = rail.current;
    const next = [...el.children].reduce((best, child, i) => Math.abs(child.offsetLeft - el.children[0].offsetLeft - el.scrollLeft) < Math.abs(el.children[best].offsetLeft - el.children[0].offsetLeft - el.scrollLeft) ? i : best, 0);
    setActive(next);
    if (interacted.current) { track(event, {card: next+1}); interacted.current = false; }
  }
  return <div role="region" aria-label={label} aria-roledescription="carousel">
    <div ref={rail} className={s.rail} style={{ '--count': items.length }} onScroll={onScroll} onTouchStart={() => { interacted.current = true; }} onKeyDown={e => { if(e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); go(active + (e.key === 'ArrowRight' ? 1 : -1)); } }} tabIndex={0}>
      {items.map((item, i) => <article className={s.card} data-analytics-card={i+1} key={i} aria-label={`${i + 1} of ${items.length}`}>{render(item, i)}</article>)}
    </div>
    <div className={s.controls}><button aria-label={`Previous ${label} card`} disabled={active === 0} onClick={() => go(active - 1)}><ArrowLeft size={18}/></button><div className={s.dots}>{items.map((_, i) => <button key={i} aria-label={`Show ${label} card ${i + 1}`} aria-current={active === i ? 'true' : undefined} onClick={() => go(i)}><span /></button>)}</div><button aria-label={`Next ${label} card`} disabled={active === items.length - 1} onClick={() => go(active + 1)}><ArrowRight size={18}/></button></div>
  </div>;
}
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const [symbol, setSymbol] = useState(0);
  const [playing, setPlaying] = useState(false);
  useHomepageAnalytics();
  const milestones = useRef(new Set());
  function videoProgress(video, ended = false) {
    if (!video.duration) return;
    const fraction = video.played.length ? Array.from({length:video.played.length}, (_,i) => video.played.end(i)-video.played.start(i)).reduce((a,b)=>a+b,0)/video.duration : 0;
    for (const percent of [25,50,75,100]) {
      if ((fraction*100 >= percent || (percent===100 && ended && fraction>=.95)) && !milestones.current.has(percent)) {
        milestones.current.add(percent); track('unboxing_video_progress',{percent});
      }
    }
  }
  return <div className={s.page}>
    <Head><title>MindMirror3D — What Would Your Inner Self Look Like?</title><meta name="description" content="Explore real MindMirror sculptures and discover how your self-discovery results become a physical sculpture and personalized guidebook." /></Head>
    <header className={s.header} onKeyDown={e => { if (e.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); } }}>
      <Link href="/" className={s.brand}>MindMirror<span>3D</span></Link>
      <button ref={menuButton} type="button" className={s.menuButton} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="homepage-menu" onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <X size={24}/> : <Menu size={24}/>}</button>
      <nav id="homepage-menu" className={`${s.navigation} ${menuOpen ? s.menuOpen : ''}`} aria-label="Main navigation" onClick={() => setMenuOpen(false)}>
        <a href="#how">How it works</a><Link href="/about">About us</Link><Link href="/contact">Contact</Link>
      </nav>
    </header>
    <main>
      <section data-analytics-section="hero" className={`${s.hero} ${s.wrap}`}>
        <div className={s.heroCopy}><h1>What Would Your <em>Inner Self</em> Look Like?</h1><p className={s.lead}>A self-discovery journey turned into a physical sculpture and guidebook.</p><a href="#how" className={s.button} onClick={() => track('hero_see_how_it_works_click')}>See How It Works <ArrowRight size={18}/></a><p className={s.small}>No payment required to begin.</p></div>
        <figure className={s.heroImage}><img data-analytics-hero-image src="/homepage/hero.webp" alt="A man looking at his personalized MindMirror sculpture" width="1122" height="1402" fetchPriority="high"/><figcaption>A little more of you, made visible.</figcaption></figure>
        <div className={s.mobileHero}>
          <img data-analytics-hero-image className={s.mobileHeroPhoto} src="/homepage/hero-mobile.webp" alt="A woman holding a wooden MindMirror sculpture, with the words A unique reflection of you" width="941" height="1672" fetchPriority="high"/>
          <div className={s.mobileHeroContent}>
            <h1>See Your<br/><em>Inner Self</em><br/>Turned Into<br/>a Sculpture.</h1>
            <div className={s.heroActions}>
              <Link href="/auth" className={s.mobileHeroButton} onClick={() => track('hero_free_preview_click')}>Free Preview <ArrowRight size={22} aria-hidden="true"/></Link>
              <Link href="/gift" className={`${s.mobileHeroButton} ${s.heroGiftButton}`} onClick={() => track('hero_buy_as_gift_click')}>Buy It as a Gift <Gift size={22} aria-hidden="true"/></Link>
            </div>
            <p className={s.mobileHeroNote}>No payment required to begin.</p>
          </div>
        </div>
      </section>
      <section data-analytics-section="how" className={s.tinted} id="how"><div className={s.wrap}><div className={s.sectionHeading}><h2>How MindMirror3D Works</h2></div>
        <Carousel items={steps} label="How it works" event="how_it_works_card_interaction" render={([title, text, Icon], i) => <><div className={s.stepTop}><Icon size={30} strokeWidth={1.3}/><span>0{i+1}</span></div><h3>{title}</h3><p>{text}</p></>}/><div className={s.center}><PreviewLink location="how">See My Free Preview</PreviewLink></div>
      </div></section>
      <section data-analytics-section="example" className={`${s.example} ${s.wrap}`} aria-labelledby="example-title">
        <img src="/homepage/real-example.webp" alt="A woman holding her own MindMirror sculpture" width="1198" height="1313" loading="lazy"/>
        <div><h2 id="example-title">A real self-discovery story</h2><blockquote>“I felt seen. The sculpture gave me a new way to understand and reflect on myself.”</blockquote><p><strong>Johanne</strong></p></div>
      </section>
      <section data-analytics-section="explore" className={`${s.wrap} ${s.explore}`}><div className={s.sectionHeading}><p className={s.eyebrow}>EVERY DETAIL HAS A STORY</p><h2>Discover the Meaning Behind the Form</h2><p>Tap a symbol to explore this sculpture.</p></div><div className={s.exploreGrid}><div className={s.sculpture}><img src="/homepage/explore-studio.png" alt="A real sculpture with a cloud-shaped head, heart body, puzzle hands and butterfly wings" width="1100" height="1500" loading="lazy"/>{symbols.map((item, i) => <button key={item.name} className={`${s.hotspot} ${symbol === i ? s.selected : ''}`} style={{left:`${item.x}%`, top:`${item.y}%`}} aria-label={`Explore ${item.name}`} aria-pressed={symbol === i} onClick={() => {setSymbol(i); track('tap_sculpture_hotspot', {symbol:item.name});}}>{i+1}</button>)}</div><div className={s.symbolPanel}><p className={s.eyebrow}>A CLOSER LOOK</p><div className={s.symbolTabs}>{symbols.map((item, i) => <button key={item.name} aria-pressed={symbol === i} onClick={() => {setSymbol(i);track('tap_sculpture_hotspot', {symbol:item.name});}}>{item.name}</button>)}</div><div aria-live="polite" className={s.symbolText}><span>0{symbol+1}</span><h3>{symbols[symbol].name}</h3><p>{symbols[symbol].text}</p></div><p className={s.small}>This is one real example. Your results guide your own sculpture’s form and symbolism.</p></div></div></section>
      <section data-analytics-section="guidebook" className={s.tinted}><div className={s.wrap}><div className={s.sectionHeading}><p className={s.eyebrow}>MORE THAN SOMETHING TO DISPLAY</p><h2>A Look Inside the Guidebook</h2><p>Explore the actual pages of one MindMirror guidebook.</p></div><BookletPreview /><div className={s.center}><PreviewLink location="guidebook">Unlock My Preview</PreviewLink></div></div></section>
      <section data-analytics-section="video" className={`${s.wrap} ${s.videoSection}`}><div><h2>From our hands to yours</h2></div><div className={s.videoFrame}>{playing ? <video src="/homepage/unboxing-10s.mp4" poster="/homepage/unboxing-poster.webp" controls autoPlay playsInline onPlay={() => track('unboxing_video_play')} onTimeUpdate={e => videoProgress(e.currentTarget)} onEnded={e => videoProgress(e.currentTarget,true)} aria-label="MindMirror sculpture and guidebook unboxing"/> : <button className={s.videoCover} onClick={() => setPlaying(true)} aria-label="Watch the 10-second unboxing"><img src="/homepage/unboxing-poster.webp" alt="The revealed sculpture beside its open box" width="900" height="900" loading="lazy"/><span><Play size={22} fill="currentColor"/> Watch the 10-second unboxing</span></button>}</div></section>
      <section data-analytics-section="final" className={s.final}><p className={s.eyebrow}>YOUR DISCOVERY STARTS HERE</p><h2>Curious What Yours<br/>Might Reveal?</h2><PreviewLink location="final">See My Free MindMirror Preview</PreviewLink><p className={s.small}>Free self-discovery test. Preview before ordering.</p></section>
    </main><footer className={`${s.footer} ${s.wrap}`}><Link href="/" className={s.brand}>MindMirror<span>3D</span></Link><p>© 2026 MindMirror3D</p><Link href="/privacy">Privacy Policy</Link><Link href="/contact">Contact</Link></footer>
  </div>;
}

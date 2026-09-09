import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { trackLoveEvent, useLoveAnalytics } from '../../lib/useLoveAnalytics';
import h from '../../styles/Home.module.css';
import s from '../../styles/Love.module.css';

const steps = [
  ['Discover Your Dynamic', 'You both answer questions about your relationship.'],
  ['Reveal What Makes You “Us”', 'Discover the patterns and dynamics that shape your relationship.'],
  ['See It Come to Life', 'Your relationship is reflected in a personalized sculpture and guidebook.'],
];

function LoveLink({ location }) {
  return <Link href="/love/early-access" className={`${h.button} ${s.button}`} onClick={() => trackLoveEvent('love_hero_cta_click', '/love', { location })}>See Our LoveMirror →</Link>;
}

export default function LovePage() {
  useLoveAnalytics('/love');
  return <div className={`${h.page} ${s.page}`}>
    <Head><title>LoveMirror3D — What Would Your Relationship Look Like?</title><meta name="description" content="See the dynamic between you reflected in a personalized sculpture and guidebook." /></Head>
    <header className={h.header}><Link href="/love" className={h.brand}>LoveMirror<span>3D</span></Link></header>
    <main>
      <section className={`${h.wrap} ${s.hero}`}>
        <div className={s.copy}>
          <h1>What Would Your <em>Relationship</em> Look Like?</h1>
          <p className={h.lead}>See the dynamic between you reflected in a personalized sculpture and guidebook.</p>
          <LoveLink location="hero" />
        </div>
        <figure className={s.photo}><Image src="/love/hero.png" alt="A couple holding a wooden sculpture of two intertwined figures" width={1145} height={1374} sizes="(max-width: 700px) 100vw, 50vw" priority /></figure>
      </section>
      <section className={h.tinted} aria-labelledby="love-how-title"><div className={h.wrap}>
        <div className={h.sectionHeading}><h2 id="love-how-title">How It Works</h2></div>
        <ol className={s.steps}>{steps.map(([title, description], index) => <li className={h.card} key={title}>
          <div className={h.stepTop}><span aria-hidden="true">0{index + 1}</span></div>
          <h3>{title}</h3><p>{description}</p>
        </li>)}</ol>
        <div className={h.center}><LoveLink location="how" /></div>
      </div></section>
    </main>
  </div>;
}

import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { ShoppingCart, Mail, Package, Gift, ArrowRight, Heart, Leaf, Users, LockKeyhole } from 'lucide-react';
import s from '../styles/Gift.module.css';

const steps = [
  [ShoppingCart, '1. You Place an Order', 'When gifting is available, you’ll be able to purchase a MindMirror as a gift.'],
  [Mail, '2. They Take the Test', 'We’ll send them a link to a short, guided self-discovery test — a simple and engaging experience.'],
  [Package, '3. We Create It', 'Their answers guide a one-of-a-kind sculpture and guidebook, made just for them.'],
  [Gift, '4. A Meaningful Gift', 'It’s delivered with care — ready to inspire, spark reflection, and be cherished for years.'],
];

export default function GiftPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  async function join(event) {
    event.preventDefault();
    if (status === 'loading') return;
    setStatus('loading'); setError('');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch('/api/gift-waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }), signal: controller.signal });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'We couldn’t save your email. Please try again.');
      setStatus('success');
    } catch (err) {
      setError(controller.signal.aborted ? 'The request took too long. Please try again.' : err instanceof TypeError ? 'We couldn’t connect. Please check your connection and try again.' : err.message);
      setStatus('idle');
    } finally { clearTimeout(timeout); }
  }
  return <div className={s.page}>
    <Head><title>A meaningful gift | MindMirror3D</title><meta name="description" content="Give a deeper kind of gift. Join the waitlist for a personalized MindMirror sculpture and guidebook for someone who matters."/></Head>
    <main>
      <section className={s.intro}>
        <p className={s.eyebrow}>A meaningful gift</p>
        <h1>Give a Deeper Kind of Gift</h1>
        <p className={s.lead}>A personalized MindMirror sculpture and guidebook —<br className={s.desktopBreak}/> a thoughtful gift for the people who matter.</p>
        <div className={s.divider}/>
        <p className={s.description}>It’s more than a physical gift. It’s a unique way to help someone<br className={s.desktopBreak}/> see themselves, feel appreciated, and start a new conversation.</p>
      </section>
      <section className={s.how} aria-labelledby="gift-how-title">
        <h2 id="gift-how-title">How It Works (As a Gift)</h2>
        <p className={s.lead}>Simple. Thoughtful. Meaningful.</p>
        <ol className={s.steps}>{steps.map(([Icon, title, description], index) => <li key={title}>
          <div className={s.icon}><Icon size={42} strokeWidth={1.5} aria-hidden="true"/></div>
          {index < steps.length - 1 && <ArrowRight className={s.arrow} size={26} strokeWidth={1.3} aria-hidden="true"/>}
          <h3>{title}</h3><p>{description}</p>
        </li>)}</ol>
        <section className={s.waitlist} aria-labelledby="waitlist-title">
          <p className={s.eyebrow}>Gifting is coming soon</p>
          <h2 id="waitlist-title">Join the Gift Waitlist</h2>
          <p className={s.lead}>Be the first to know when gifting is available.<br/>Enter your email and we’ll notify you.</p>
          {status === 'success' ? <p className={s.success} role="status">You’re on the list. We’ll email you when gifting is available.</p> : <form className={s.form} onSubmit={join}>
            <label className={s.srOnly} htmlFor="gift-email">Your email address</label>
            <input id="gift-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} aria-describedby={error ? 'gift-error' : 'gift-privacy'} disabled={status === 'loading'}/>
            <button type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Joining…' : 'Join the Waitlist'}</button>
          </form>}
          {error && <p id="gift-error" className={s.error} role="alert">{error}</p>}
          <p id="gift-privacy" className={s.privacy}><LockKeyhole size={17} aria-hidden="true"/>We’ll only email you about gifting updates. No spam, ever.</p>
        </section>
      </section>
      <section className={s.values} aria-label="A thoughtful gift">
        <div><Heart size={42} strokeWidth={1.4} aria-hidden="true"/><p>A more meaningful<br/>gift experience</p></div>
        <div><Leaf size={42} strokeWidth={1.4} aria-hidden="true"/><p>Personal, thoughtful<br/>and unique</p></div>
        <div><Users size={42} strokeWidth={1.4} aria-hidden="true"/><p>For the people<br/>who matter</p></div>
      </section>
    </main>
    <footer className={s.footer}><Link href="/" aria-label="MindMirror3D homepage">MindMirror3D</Link><p>Unique minds brighter tomorrows</p><Link href="/privacy" className={s.privacyLink}>Privacy Policy</Link></footer>
  </div>;
}

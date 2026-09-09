import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { trackLoveEvent, useLoveAnalytics } from '../../lib/useLoveAnalytics';
import h from '../../styles/Home.module.css';
import s from '../../styles/Love.module.css';

export default function LoveEarlyAccess() {
  useLoveAnalytics('/love/early-access');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  async function join(event) {
    event.preventDefault();
    if (status === 'loading') return;
    trackLoveEvent('love_email_submit', '/love/early-access');
    setStatus('loading'); setError('');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch('/api/love-early-access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }), signal: controller.signal });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.joined) throw new Error(body.error || 'We couldn’t save your email. Please try again.');
      trackLoveEvent('love_email_submit_success', '/love/early-access');
      setStatus('success');
    } catch (err) {
      setError(controller.signal.aborted ? 'The request took too long. Please try again.' : err instanceof TypeError ? 'We couldn’t connect. Please check your connection and try again.' : err.message);
      setStatus('idle');
    } finally { clearTimeout(timeout); }
  }
  return <div className={`${h.page} ${s.page}`}>
    <Head><title>LoveMirror3D — Early Access</title><meta name="description" content="Join the LoveMirror3D early access list." /></Head>
    <header className={h.header}><Link href="/love" className={h.brand}>LoveMirror<span>3D</span></Link></header>
    <main className={s.access}>
      <h1>LoveMirror3D is coming soon.</h1>
      <p className={s.accessLead}>Join the early access list and we&apos;ll let you know when it&apos;s available.</p>
      {status === 'success' ? <p className={s.success} role="status">You’re on the list. We’ll let you know when LoveMirror3D is available.</p> : <form className={s.form} onSubmit={join} aria-busy={status === 'loading'}>
        <div className={s.field}><label htmlFor="love-email">Email address</label><input id="love-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} aria-describedby={error ? 'love-error love-disclosure' : 'love-disclosure'} disabled={status === 'loading'} /></div>
        <button className={`${h.button} ${s.button}`} type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Joining…' : 'Join Early Access'}</button>
      </form>}
      {error && <p id="love-error" className={s.error} role="alert">{error}</p>}
      <p id="love-disclosure" className={s.disclosure}>LoveMirror3D is a concept by MindMirror3D, currently being tested. Joining the interest list does not place an order or charge you.</p>
    </main>
  </div>;
}

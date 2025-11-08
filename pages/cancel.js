// pages/cancel.js
import Link from 'next/link';

export default function Cancel() {
  return (
    <main style={{ maxWidth: 640, margin: '80px auto', padding: 24, textAlign: 'center' }}>
      <h1 style={{ fontSize: 28, marginBottom: 12, color: '#dc2626' }}>Payment Canceled</h1>
      <p style={{ color: '#374151', marginBottom: 24 }}>
        No worries — your card wasn’t charged. You can try again anytime.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link href="/payment">
          <button style={{ background: '#2563eb', color: '#fff', padding: '10px 16px', borderRadius: 8 }}>
            Try Again
          </button>
        </Link>
        <Link href="/">
          <button style={{ border: '1px solid #d1d5db', padding: '10px 16px', borderRadius: 8 }}>
            Home
          </button>
        </Link>
      </div>
    </main>
  );
}

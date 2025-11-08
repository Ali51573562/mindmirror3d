// pages/success.js
import Link from 'next/link';

export default function Success() {
  return (
    <main style={{ maxWidth: 640, margin: '80px auto', padding: 24, textAlign: 'center' }}>
      <h1 style={{ fontSize: 28, marginBottom: 12, color: '#16a34a' }}>Payment Successful 🎉</h1>
      <p style={{ color: '#374151', marginBottom: 24 }}>
        Thank you! Your order has been received. We’ll email you updates about your personalized sculpture.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link href="/profile">
          <button style={{ background: '#2563eb', color: '#fff', padding: '10px 16px', borderRadius: 8 }}>
            Go to Profile
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

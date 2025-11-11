// pages/payment.js
import { useState } from 'react';
import Navbar from '../components/Navbar';

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handlePayNow = async () => {
    setLoading(true);
    setMsg('');
    try {
      const resp = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to create session');
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (e) {
      setMsg(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Complete Your Order</h1>
        <p className="text-gray-600 mb-8">
          You’ll be redirected to our secure payment page.
        </p>

        <button
          onClick={handlePayNow}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
        >
          {loading ? 'Redirecting…' : 'Pay Now'}
        </button>

        {msg && <p className="mt-4 text-sm text-red-700">{msg}</p>}
      </main>
    </>
  );
}

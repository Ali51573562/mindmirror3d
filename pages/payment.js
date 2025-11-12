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
      window.location.href = data.url; // Redirect to Stripe Checkout
    } catch (e) {
      setMsg(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-16 text-center text-gray-800">
        {/* Intro */}
        <h1 className="text-3xl font-bold mb-4 text-gray-900">
          Your Personalized MindMirror Sculpture
        </h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          You’ve completed your personality journey — now we’ll turn your results into a 3D sculpture that
          <span className="font-semibold text-gray-800"> represents your inner self</span>.
          Each piece is custom-designed and shipped with a printed guidebook explaining the meaning behind your form.
        </p>

        {/* Price Card */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 shadow-sm mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Sculpture + Guidebook
          </h2>
          <p className="text-gray-600 mb-4">Personalized design • Free U.S. shipping</p>
          <p className="text-4xl font-bold text-blue-600 mb-6">$199</p>
          <button
            onClick={handlePayNow}
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl text-lg font-medium hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? 'Redirecting…' : 'Pay Now'}
          </button>
          {msg && <p className="mt-4 text-sm text-red-600">{msg}</p>}
        </div>

        {/* Trust & reassurance */}
        <div className="text-gray-500 text-sm leading-relaxed space-y-2">
          <p>
            Your payment is securely processed by <span className="text-gray-700 font-medium">Stripe</span>.
          </p>
          <p>
            Once your order is complete, you’ll receive an email confirmation and updates as we design your sculpture.
          </p>
          <p>
            Questions? <a href="/contact" className="text-blue-600 hover:underline">Contact us anytime</a>.
          </p>
        </div>
      </main>
    </>
  );
}

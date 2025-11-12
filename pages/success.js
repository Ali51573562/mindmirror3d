// pages/success.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabaseClient';

export default function Success() {
  const router = useRouter();
  const [status, setStatus] = useState('verifying'); // verifying | paid | pending | error
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const session_id = router.query.session_id;
      if (!session_id) return;

      // get current user (must be logged in when returning)
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) {
        setStatus('error');
        setMsg('Please log in again so we can finalize your order.');
        return;
      }

      try {
        const resp = await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id, user_id: user.id, user_email: user.email }),
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error || 'Verification failed');

        if (json.ok && json.status === 'paid') {
          setStatus('paid');
        } else {
          setStatus('pending'); // payment_status may be 'unpaid' or 'no_payment_required'
        }
      } catch (e) {
        setStatus('error');
        setMsg(e.message);
      }
    })();
  }, [router.query.session_id]);

  return (
    <>
      <Navbar />
      <main className="max-w-xl mx-auto px-6 py-16 text-center">
        {status === 'verifying' && (
          <>
            <h1 className="text-3xl font-bold mb-3">Verifying your payment…</h1>
            <p className="text-gray-600">This usually takes a moment.</p>
          </>
        )}

        {status === 'paid' && (
          <>
            <h1 className="text-3xl font-bold text-green-600 mb-3">Payment Successful</h1>
            <p className="text-gray-700 mb-6">Thank you! Your order is confirmed. We’ll email updates as we design your sculpture.</p>
            <button
              onClick={() => router.push('/profile')}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Go to Profile
            </button>
          </>
        )}

        {status === 'pending' && (
          <>
            <h1 className="text-3xl font-bold text-amber-600 mb-3">Payment Pending</h1>
            <p className="text-gray-700">We didn’t receive a confirmed payment yet. If you were charged, this will update shortly.</p>
            <button
              onClick={() => router.push('/profile')}
              className="mt-6 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Go to Profile
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-3xl font-bold text-red-600 mb-3">We couldn’t verify your payment</h1>
            <p className="text-gray-700">{msg || 'Please try again or contact support.'}</p>
          </>
        )}
      </main>
    </>
  );
}

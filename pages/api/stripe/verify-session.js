// pages/api/stripe/verify-session.js
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { session_id, user_id, user_email } = req.body || {};
  if (!session_id || !user_id) return res.status(400).json({ error: 'Missing session_id or user_id' });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
    const sess = await stripe.checkout.sessions.retrieve(session_id);

    if (sess.payment_status !== 'paid') {
      return res.status(200).json({ ok: false, status: sess.payment_status });
    }

    // Update Supabase (server-side, use service role)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // server-only
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await supabase
      .from('results')
      .upsert({ user_id, email: user_email || null, order_status: 'paid' }, { onConflict: 'user_id' });

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ ok: true, status: 'paid' });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Verification failed' });
  }
}

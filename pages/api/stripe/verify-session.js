// pages/api/stripe/verify-session.js
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';



export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id, user_id, user_email } = req.body || {};
  if (!session_id || !user_id) {
    return res.status(400).json({ error: 'Missing session_id or user_id' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    // 1) Get the checkout session from Stripe
    const sess = await stripe.checkout.sessions.retrieve(session_id);

    if (sess.payment_status !== 'paid') {
      return res.status(200).json({ ok: false, status: sess.payment_status });
    }

    // 2) Read metadata (sent from /api/checkout)
    const md = sess.metadata || {};

    const full_name = md.full_name || null;
    const first_name = md.first_name || null;

    const shipping_line1 = md.ship_line1 || null;
    const shipping_line2 = md.ship_line2 || null;
    const shipping_city = md.ship_city || null;
    const shipping_state = md.ship_state || null;
    const shipping_zip = md.ship_zip || null;
    const shipping_country = md.ship_country || null;

    // 3) Supabase (service role)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // server-only
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 4) Upsert into results table
    const payload = {
      user_id,
      email: user_email || null,
      order_status: 'paid',

      // New fields:
      full_name,
      first_name,
      shipping_line1,
      shipping_line2,
      shipping_city,
      shipping_state,
      shipping_zip,
      shipping_country,
    };

    const { error } = await supabase
      .from('results')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true, status: 'paid' });
  } catch (e) {
    return res
      .status(500)
      .json({ error: e.message || 'Verification failed' });
  }
}

// pages/api/checkout.js
import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;            // LIVE or TEST secret
    const priceId = process.env.STRIPE_PRICE_ID;                    // MUST be a price_... id
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mindmirror3d.com';

    if (!stripeSecret || !priceId) {
      return res.status(500).json({ error: 'Stripe env vars missing' });
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        { price: priceId, quantity: 1 },   // 👈 ensure this is a PRICE ID
      ],
      success_url: `${siteUrl}/success`,
      cancel_url: `${siteUrl}/cancel`,
      // You can add customer_email or metadata here if you want
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('checkout error:', e);
    return res.status(500).json({ error: e.message || 'Checkout failed' });
  }
}

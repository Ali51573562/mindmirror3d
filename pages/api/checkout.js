// pages/api/checkout.js
import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
    const priceId = process.env.STRIPE_PRICE_ID; // must be set to a real price_... in .env.local
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mindmirror3d.com';

    // 👇 from payment page
    const { full_name, first_name, shipping_address } = req.body || {};

    if (!priceId) {
      return res.status(500).json({ error: 'STRIPE_PRICE_ID is not set in environment.' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,   // ✅ must be a valid Stripe Price ID like "price_..."
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cancel`,

      // Optional but useful: also let Stripe collect shipping address UI-side
      shipping_address_collection: {
        allowed_countries: ['US'],
      },

      // Attach user info + shipping to metadata for later (Dashboard/webhooks)
      metadata: {
        full_name: full_name || '',
        first_name: first_name || '',
        ship_line1: shipping_address?.line1 || '',
        ship_line2: shipping_address?.line2 || '',
        ship_city: shipping_address?.city || '',
        ship_state: shipping_address?.state || '',
        ship_zip: shipping_address?.postal_code || '',
        ship_country: shipping_address?.country || '',
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('Checkout error:', e);
    return res.status(500).json({ error: e.message || 'Checkout failed' });
  }
}

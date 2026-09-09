import { analyticsDatabase } from '../../lib/analyticsServer';

export const config = { api: { bodyParser: { sizeLimit: '2kb' } } };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (req.headers.origin) {
    try { if (new URL(req.headers.origin).host !== req.headers.host) return res.status(403).json({ error: 'Request not allowed' }); }
    catch { return res.status(403).json({ error: 'Request not allowed' }); }
  }
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  try {
    const { error } = await analyticsDatabase().from('love_early_access').upsert({ email }, { onConflict: 'email', ignoreDuplicates: true }).abortSignal(AbortSignal.timeout(8000));
    if (error) return res.status(503).json({ error: 'Early access signup is temporarily unavailable. Please try again later.' });
    return res.status(200).json({ joined: true });
  } catch { return res.status(503).json({ error: 'Early access signup is temporarily unavailable. Please try again later.' }); }
}


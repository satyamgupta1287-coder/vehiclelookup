// api/getdata.js
// Vercel Serverless Function — acts as a server-side proxy to the demo
// vehicle-lookup endpoint so the browser never hits CORS restrictions.
//
// Usage from frontend:
//   fetch('/api/getdata?reg=JH11AB1187')

export default async function handler(req, res) {
  // Allow this endpoint to be called from your own frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reg } = req.query;

  if (!reg || typeof reg !== 'string' || !reg.trim()) {
    return res.status(400).json({ error: 'Missing required query param: reg' });
  }

  // Basic sanity check on format (letters/numbers only, reasonable length)
  const cleanReg = reg.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(cleanReg)) {
    return res.status(400).json({ error: 'Invalid registration number format' });
  }

  const UPSTREAM_BASE = 'https://carter-handheld-textbook-fairy.trycloudflare.com/vnum';

  try {
    const upstreamRes = await fetch(`${UPSTREAM_BASE}?reg=${encodeURIComponent(cleanReg)}`);

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({
        error: `Upstream returned ${upstreamRes.status}`,
      });
    }

    const data = await upstreamRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach upstream service', detail: err.message });
  }
}

// api/getdata.js
// Vercel Serverless Function — acts as a secure server-side proxy.
// Frontend sirf is file ko call karega, original APIs hidden rahengi.

export default async function handler(req, res) {
  // Allow CORS
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

  // Sanity check on format
  const cleanReg = reg.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(cleanReg)) {
    return res.status(400).json({ error: 'Invalid registration number format' });
  }

  // Dono APIs ke URLs set karo
  const MOBILE_API_URL = `https://carter-handheld-textbook-fairy.trycloudflare.com/vnum?reg=${encodeURIComponent(cleanReg)}`;
  const OWNER_API_URL = `https://vehicleinfo.noobgamingv40.workers.dev/fetch?vehicle=${encodeURIComponent(cleanReg)}`;

  try {
    // Dono APIs ko ek saath (parallel) hit karo taaki speed fast rahe
    const [mobileRes, ownerRes] = await Promise.allSettled([
      fetch(MOBILE_API_URL),
      fetch(OWNER_API_URL)
    ]);

    let finalMobile = "N/A";
    let finalOwner = "N/A";

    // 1. Mobile Data Extract karna (Puraani API se)
    if (mobileRes.status === 'fulfilled' && mobileRes.value.ok) {
      try {
        const mobileData = await mobileRes.value.json();
        // API ke structure ke hisaab se jo field mile use pick karein
        finalMobile = mobileData.mobile_no || mobileData.mobile || mobileData.number || mobileData.phone || mobileData.result || "N/A";
      } catch (e) {
        console.error("Error parsing Mobile API JSON");
      }
    }

    // 2. Owner Name Extract karna (Nayi API se)
    if (ownerRes.status === 'fulfilled' && ownerRes.value.ok) {
      try {
        const ownerData = await ownerRes.value.json();
        // Nayi API se strictly owner name pick karein
        finalOwner = ownerData.owner || ownerData.Owner || "N/A";
      } catch (e) {
        console.error("Error parsing Owner API JSON");
      }
    }

    // Frontend ko ek saaf aur combined response bhejo
    return res.status(200).json({
      owner: finalOwner,
      mobile: finalMobile
    });

  } catch (err) {
    return res.status(502).json({ error: 'Server processing failed', detail: err.message });
  }
}

// api/getdata.js
// Bulletproof Serverless Proxy

export default async function handler(req, res) {
  // CORS Headers
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

  // 1. Strict Cleaning: Sirf Letters aur Numbers allow karenge
  const cleanReg = reg.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  const MOBILE_API_URL = `https://carter-handheld-textbook-fairy.trycloudflare.com/vnum?reg=${cleanReg}`;
  const OWNER_API_URL = `https://vehicleinfo.noobgamingv40.workers.dev/fetch?vehicle=${cleanReg}`;

  // 2. Anti-Bot Headers: Cloudflare ko bypass karne ke liye fake browser footprint
  const fetchOptions = {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://google.com/'
    }
  };

  try {
    const [mobileRes, ownerRes] = await Promise.allSettled([
      fetch(MOBILE_API_URL, fetchOptions),
      fetch(OWNER_API_URL, fetchOptions)
    ]);

    let finalMobile = "N/A";
    let finalOwner = "N/A";

    // 3. Safe Parsing for Mobile API
    if (mobileRes.status === 'fulfilled' && mobileRes.value.ok) {
      try {
        const text = await mobileRes.value.text();
        const data = JSON.parse(text);
        
        finalMobile = data.mobile_no || data.mobile || data.number || data.phone || 
                     (data.result && (data.result.mobile_no || data.result.mobile || data.result.phone)) || 
                     "N/A";
      } catch (e) {
        console.error("Mobile API JSON parse failed");
      }
    }

    // 4. Safe Parsing for Owner API (Handles all common nested structures)
    if (ownerRes.status === 'fulfilled' && ownerRes.value.ok) {
      try {
        const text = await ownerRes.value.text();
        const data = JSON.parse(text);
        
        // Deep search check for Owner Name
        finalOwner = data.owner || data.Owner || data.OWNER || 
                     (data.data && (data.data.owner || data.data.Owner)) || 
                     (data.result && (data.result.owner || data.result.Owner)) || 
                     "N/A";
      } catch (e) {
        console.error("Owner API JSON parse failed");
      }
    }

    // Final clean response to frontend
    return res.status(200).json({
      owner: finalOwner,
      mobile: finalMobile
    });

  } catch (err) {
    return res.status(502).json({ error: 'Server processing failed', detail: err.message });
  }
}

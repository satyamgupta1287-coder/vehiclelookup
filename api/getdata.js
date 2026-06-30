// api/getdata.js
// Dual-API Secure Proxy: Fetches Mobile from API 1 and Owner from API 2

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

  // Strict Cleaning
  const cleanReg = reg.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Dono APIs Set Karna
  const MOBILE_API_URL = `https://carter-handheld-textbook-fairy.trycloudflare.com/vnum?reg=${cleanReg}`;
  const OWNER_API_URL = `https://vehicleinfo.noobgamingv40.workers.dev/fetch?vehicle=${cleanReg}`;

  // Anti-Bot Headers
  const fetchOptions = {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*'
    }
  };

  try {
    // Dono APIs ko PARALLEL (ek saath) call karenge taaki speed kam na ho
    const [mobileRes, ownerRes] = await Promise.allSettled([
      fetch(MOBILE_API_URL, fetchOptions),
      fetch(OWNER_API_URL, fetchOptions)
    ]);

    let finalMobile = "N/A";
    let finalOwner = "N/A";

    // ==========================================
    // 1. MOBILE NUMBER EXTRACTION (Purani API se)
    // ==========================================
    if (mobileRes.status === 'fulfilled' && mobileRes.value.ok) {
      try {
        const text = await mobileRes.value.text();
        const data = JSON.parse(text);
        
        finalMobile = data.mobile_no || data.mobile || data.number || data.phone || 
                     (data.result && (data.result.mobile_no || data.result.mobile || data.result.phone)) || 
                     "N/A";
      } catch (e) {
        console.error("Mobile API parsing failed");
      }
    }

    // ==========================================
    // 2. OWNER NAME EXTRACTION (Nayi API se - exact screenshot format)
    // ==========================================
    if (ownerRes.status === 'fulfilled' && ownerRes.value.ok) {
      try {
        const text = await ownerRes.value.text();
        const data = JSON.parse(text);
        
        if (data && data.vehicle_data && data.vehicle_data.owner) {
          finalOwner = data.vehicle_data.owner;
        } else {
          // Fallback just in case format changes slightly
          finalOwner = data.owner || data.Owner || (data.data && data.data.owner) || "N/A";
        }
      } catch (e) {
        console.error("Owner API parsing failed");
      }
    }

    // Final clean response UI ko bhej rahe hain
    return res.status(200).json({
      owner: finalOwner,
      mobile: finalMobile
    });

  } catch (err) {
    return res.status(502).json({ error: 'Server processing failed', detail: err.message });
  }
}

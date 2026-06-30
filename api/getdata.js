// api/getdata.js
// Updated Backend Code exactly matching your API JSON structure

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

  // Aapki Main API jisme Owner aur Mobile dono hain
  const API_URL = `https://vehicleinfo.noobgamingv40.workers.dev/fetch?vehicle=${cleanReg}`;

  // 2. Anti-Bot Headers: Cloudflare ko bypass karne ke liye
  const fetchOptions = {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*'
    }
  };

  try {
    const response = await fetch(API_URL, fetchOptions);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const text = await response.text();
    const data = JSON.parse(text);

    let finalOwner = "N/A";
    let finalMobile = "N/A";

    // ✅ SCREENSHOT KE HISAAB SE EXACT PARSING
    
    // 1. Owner Name Extract (vehicle_data ke andar hai)
    if (data && data.vehicle_data && data.vehicle_data.owner) {
      finalOwner = data.vehicle_data.owner;
    }

    // 2. Mobile Number Extract (Seedha bahar hai)
    if (data && data.mobile_number) {
      finalMobile = data.mobile_number;
    }

    // Final clean response frontend ko bhejo
    return res.status(200).json({
      owner: finalOwner,
      mobile: finalMobile
    });

  } catch (err) {
    return res.status(502).json({ error: 'Server processing failed', detail: err.message });
  }
}

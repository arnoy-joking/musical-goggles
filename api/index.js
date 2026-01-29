export default async function handler(req, res) {
  const { videoId } = req.query;

  if (!videoId) {
    return res.status(400).json({ error: "Missing videoId parameter" });
  }

  try {
    // 1. Fetch raw cookies from your Gist
    const gistUrl = "https://gist.githubusercontent.com/arnoy-joking/d8ab574454c00269fa2449cfd116b6cd/raw";
    const gistResponse = await fetch(gistUrl);
    const rawText = await gistResponse.text();

    // 2. Parse Netscape format to Header format
    const cookieHeader = rawText
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => {
        const parts = line.split('\t');
        return parts.length >= 7 ? `${parts[5].trim()}=${parts[6].trim()}` : null;
      })
      .filter(Boolean)
      .join('; ');

    // 3. YouTube Desktop API Request
    const youtubeUrl = "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";

    const payload = {
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20240210.01.00",
          platform: "DESKTOP",
          hl: "en",
          gl: "US",
          timeZone: "Asia/Dhaka",
          utcOffsetMinutes: 360
        },
        user: {
          lockedSafetyMode: false
        }
      },
      videoId: videoId,
      playbackContext: {
        contentPlaybackContext: {
          signatureTimestamp: 19744 // Update this if signatures fail
        }
      },
      contentCheckOk: true,
      racyCheckOk: true
    };

    const ytResponse = await fetch(youtubeUrl, {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Content-Type": "application/json",
        "Cookie": cookieHeader,
        "Origin": "https://www.youtube.com",
        "Referer": "https://www.youtube.com/"
      },
      body: JSON.stringify(payload)
    });

    const data = await ytResponse.json();

    // Set CORS headers so your HTML can access it
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

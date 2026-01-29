export default async function handler(req, res) {
  // 1. Get Video ID from URL query (e.g., ?v=VIDEO_ID)
  const videoId = req.query.v;

  if (!videoId) {
    return res.status(400).json({ 
      error: "Missing 'v' parameter", 
      usage: "/api?v=c-FKlE3_kHo" 
    });
  }

  // URL to your cookies.txt
  const COOKIE_GIST_URL = "https://gist.githubusercontent.com/arnoy-joking/d8ab574454c00269fa2449cfd116b6cd/raw/9584d061b3164d6d4b46ea079c69c1ec859f67e7/cookies.txt";

  try {
    // 2. Fetch and Parse Cookies
    const cookieString = await getCookiesFromGist(COOKIE_GIST_URL);

    // 3. Prepare InnerTube Request
    const ytUrl = "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";

    const payload = {
      context: {
        client: {
          clientName: "ANDROID",
          clientVersion: "20.10.38",
          androidSdkVersion: 34,
          hl: "en",
          gl: "US"
        }
      },
      videoId: videoId,
      contentCheckOk: true,
      racyCheckOk: true
    };

    // 4. Send Request to YouTube
    const ytResponse = await fetch(ytUrl, {
      method: "POST",
      headers: {
        "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14)",
        "Content-Type": "application/json",
        "Cookie": cookieString // Injecting the cookies here
      },
      body: JSON.stringify(payload)
    });

    if (!ytResponse.ok) {
      const text = await ytResponse.text();
      return res.status(ytResponse.status).json({ 
        error: "YouTube API Error", 
        status: ytResponse.status, 
        body: text 
      });
    }

    const data = await ytResponse.json();

    // 5. Clean up response (mimicking your Python script logic)
    const result = {
      videoDetails: data.videoDetails || null,
      playabilityStatus: data.playabilityStatus || null,
      streamingData: data.streamingData || null
    };

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Helper to fetch Netscape cookies.txt and convert to Header string
 */
async function getCookiesFromGist(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch cookies");
    
    const text = await response.text();
    const cookies = [];

    // Parse Netscape format
    const lines = text.split('\n');
    for (const line of lines) {
      // Skip comments and empty lines
      if (line.startsWith('#') || !line.trim()) continue;

      const parts = line.split('\t');
      
      // We need at least 7 columns. 
      // Index 5 is Name, Index 6 is Value.
      if (parts.length >= 7) {
        const name = parts[5];
        const value = parts[6].trim(); // trim newline characters
        cookies.push(`${name}=${value}`);
      }
    }

    // Join with "; " for the HTTP Header
    return cookies.join('; ');

  } catch (e) {
    console.error("Cookie fetch error:", e);
    return ""; // Return empty string if fails, try without cookies
  }
}

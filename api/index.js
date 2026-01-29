export default async function handler(req, res) {
  const videoId = req.query.v;

  if (!videoId) {
    return res.status(400).json({ error: "Missing 'v' parameter" });
  }

  // URL to your cookies.txt
  const COOKIE_GIST_URL = "https://gist.githubusercontent.com/arnoy-joking/d8ab574454c00269fa2449cfd116b6cd/raw/9584d061b3164d6d4b46ea079c69c1ec859f67e7/cookies.txt";

  try {
    // 1. Fetch Cookies
    const cookieString = await getCookiesFromGist(COOKIE_GIST_URL);

    // 2. Use iOS Client (Bypasses the Android "Bot" check)
    const ytUrl = "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";

    const payload = {
      context: {
        client: {
          clientName: "IOS",
          clientVersion: "19.45.4",
          deviceMake: "Apple",
          deviceModel: "iPhone16,2",
          osName: "iPhone",
          osVersion: "17.5.1",
          hl: "en",
          gl: "US",
          utcOffsetMinutes: 0
        }
      },
      videoId: videoId,
      contentCheckOk: true,
      racyCheckOk: true
    };

    // 3. Request with iOS Headers
    const response = await fetch(ytUrl, {
      method: "POST",
      headers: {
        "User-Agent": "com.google.ios.youtube/19.45.4 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)",
        "Content-Type": "application/json",
        "Cookie": cookieString,
        "X-Goog-Api-Format-Version": "2"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: "YouTube API Error", body: text });
    }

    const data = await response.json();

    // 4. Return relevant data
    return res.status(200).json({
      videoDetails: data.videoDetails || null,
      playabilityStatus: data.playabilityStatus || null,
      streamingData: data.streamingData || null
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// --- Helper Functions ---

async function getCookiesFromGist(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return "";
    
    const text = await res.text();
    const cookies = [];

    text.split('\n').forEach(line => {
      if (line.startsWith('#') || !line.trim()) return;
      const parts = line.split('\t');
      if (parts.length >= 7) {
        cookies.push(`${parts[5]}=${parts[6].trim()}`);
      }
    });

    return cookies.join('; ');
  } catch (e) {
    console.error("Cookie fetch failed:", e);
    return "";
  }
}

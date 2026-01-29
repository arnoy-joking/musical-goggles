import crypto from 'crypto';

export default async function handler(req, res) {
  const videoId = req.query.v;

  if (!videoId) {
    return res.status(400).json({ error: "Missing 'v' parameter" });
  }

  // URL to your cookies.txt
  const COOKIE_GIST_URL = "https://gist.githubusercontent.com/arnoy-joking/d8ab574454c00269fa2449cfd116b6cd/raw/9584d061b3164d6d4b46ea079c69c1ec859f67e7/cookies.txt";

  try {
    // 1. Fetch and Parse Cookies
    const { cookieString, sapisid } = await getCookiesAndSapisid(COOKIE_GIST_URL);

    // 2. Generate the Auth Hash (Crucial for "Not a Bot" / Login check)
    // Formula: SAPISIDHASH {timestamp}_{sha1(timestamp + sapisid + origin)}
    const origin = "https://www.youtube.com";
    const timestamp = Math.floor(Date.now() / 1000);
    const authHash = sapisid 
      ? `SAPISIDHASH ${timestamp}_${crypto.createHash('sha1').update(`${timestamp} ${sapisid} ${origin}`).digest('hex')}`
      : "";

    // 3. Prepare Request (Using iOS Client - currently most stable for Serverless)
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

    // 4. Send Request with Headers
    const headers = {
      "User-Agent": "com.google.ios.youtube/19.45.4 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)",
      "Content-Type": "application/json",
      "X-Goog-Api-Format-Version": "2",
      "X-Origin": origin,
      "Cookie": cookieString
    };

    // Only add Authorization if we found the SAPISID
    if (authHash) {
      headers["Authorization"] = authHash;
    }

    const response = await fetch(ytUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: "YouTube API Error", body: text });
    }

    const data = await response.json();

    return res.status(200).json({
      videoDetails: data.videoDetails || null,
      playabilityStatus: data.playabilityStatus || null,
      streamingData: data.streamingData || null
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Helper: Fetches text, builds Cookie header string, and extracts SAPISID
 */
async function getCookiesAndSapisid(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not fetch cookies");
    
    const text = await res.text();
    const cookies = [];
    let sapisid = "";

    text.split('\n').forEach(line => {
      // Netscape format: domain flag path secure expiration name value
      if (line.startsWith('#') || !line.trim()) return;
      
      const parts = line.split('\t');
      if (parts.length >= 7) {
        const name = parts[5];
        const value = parts[6].trim();
        
        cookies.push(`${name}=${value}`);
        
        if (name === "SAPISID") {
          sapisid = value;
        }
      }
    });

    return { 
      cookieString: cookies.join('; '), 
      sapisid: sapisid 
    };
  } catch (e) {
    console.error(e);
    return { cookieString: "", sapisid: "" };
  }
}

import type { IncomingMessage, ServerResponse } from 'node:http';

interface ShortenRequestBody {
  url?: string;
}

export default async function handler(
  req: IncomingMessage & { body?: any },
  res: ServerResponse & {
    status?: (code: number) => any;
    json?: (body: any) => void;
  }
) {
  // CORS Headers for API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const sendJson = (statusCode: number, data: any) => {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
  };

  if (req.method !== 'POST') {
    return sendJson(405, { error: 'Method not allowed' });
  }

  // Parse body if needed
  let rawBody: ShortenRequestBody = {};
  if (req.body && typeof req.body === 'object') {
    rawBody = req.body;
  } else {
    try {
      const chunks: Uint8Array[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const str = Buffer.concat(chunks).toString('utf-8');
      if (str) {
        rawBody = JSON.parse(str);
      }
    } catch {
      // Fallback
    }
  }

  const longUrl = rawBody.url;
  if (!longUrl || typeof longUrl !== 'string') {
    return sendJson(400, { error: 'Missing or invalid "url" parameter' });
  }

  // Tier 1: Try spoo.me (ultra-compact ~22 chars)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const resp = await fetch('https://spoo.me/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({ url: longUrl }).toString(),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const data = (await resp.json()) as { short_url?: string };
      if (data?.short_url) {
        // Enforce HTTPS
        const secureUrl = data.short_url.replace(/^http:\/\//i, 'https://');
        return sendJson(200, { shortUrl: secureUrl, provider: 'spoo.me' });
      }
    }
  } catch (err) {
    console.warn('[API/Shorten] spoo.me failed, falling back:', err);
  }

  // Tier 2: Try TinyURL (~27 chars)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const resp = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const text = (await resp.text()).trim();
      if (text.startsWith('http')) {
        const secureUrl = text.replace(/^http:\/\//i, 'https://');
        return sendJson(200, { shortUrl: secureUrl, provider: 'tinyurl' });
      }
    }
  } catch (err) {
    console.warn('[API/Shorten] TinyURL failed, falling back:', err);
  }

  // Tier 3: Try is.gd (~26 chars)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const resp = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const data = (await resp.json()) as { shorturl?: string };
      if (data?.shorturl) {
        return sendJson(200, { shortUrl: data.shorturl, provider: 'is.gd' });
      }
    }
  } catch (err) {
    console.warn('[API/Shorten] is.gd failed:', err);
  }

  // Fallback: If all shorteners failed or timed out, return original URL
  return sendJson(200, { shortUrl: longUrl, provider: 'original' });
}

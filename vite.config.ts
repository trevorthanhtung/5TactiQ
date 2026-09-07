import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Plugin for local development: proxies /api/shorten without needing external CORS or Vercel CLI
function apiShortenDevPlugin() {
  return {
    name: 'api-shorten-dev',
    configureServer(server: any) {
      server.middlewares.use('/api/shorten', async (req: any, res: any) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let bodyStr = '';
        req.on('data', (chunk: any) => { bodyStr += chunk; });
        req.on('end', async () => {
          try {
            const body = JSON.parse(bodyStr || '{}');
            const longUrl = body.url;
            if (!longUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing url parameter' }));
              return;
            }

            // Tier 1: spoo.me
            try {
              const resp = await fetch('https://spoo.me/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Accept': 'application/json'
                },
                body: new URLSearchParams({ url: longUrl }).toString()
              });
              if (resp.ok) {
                const data = (await resp.json()) as { short_url?: string };
                if (data?.short_url) {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ shortUrl: data.short_url.replace(/^http:\/\//i, 'https://'), provider: 'spoo.me' }));
                  return;
                }
              }
            } catch {}

            // Tier 2: TinyURL
            try {
              const resp = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
              if (resp.ok) {
                const text = (await resp.text()).trim();
                if (text.startsWith('http')) {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ shortUrl: text.replace(/^http:\/\//i, 'https://'), provider: 'tinyurl' }));
                  return;
                }
              }
            } catch {}

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ shortUrl: longUrl, provider: 'original' }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Server error' }));
          }
        });
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  server: {
    host: true,
  },
  plugins: [
    apiShortenDevPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: true
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'splash.png', 'logo.png'],
      manifest: {
        name: '5TactiQ',
        short_name: '5TactiQ',
        description: '5TactiQ Futsal Team Management & Tactical Board',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'fullscreen',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: "Xem Sa bàn",
            short_name: "Sa bàn",
            description: "Mở bảng chiến thuật 5TactiQ",
            url: "/tactics",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Quản lý Đội hình",
            short_name: "Đội hình",
            description: "Xem và chỉnh sửa danh sách cầu thủ",
            url: "/roster",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Đồng bộ Dữ liệu",
            short_name: "Đồng bộ",
            description: "Sao lưu và phục hồi dữ liệu",
            url: "/sync",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          }
        ],
        share_target: {
          action: "/sync",
          method: "GET",
          params: {
            title: "title",
            text: "text",
            url: "url"
          }
        }
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
            }
          }
        ]
      }
    })
  ],
})

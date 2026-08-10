import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  server: {
    host: true,
  },
  plugins: [
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

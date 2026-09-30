import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * 两种产出：
 * - 默认（npm run build）：给浏览器 / PWA 用，带 Service Worker，可离线、可加到主屏。
 * - capacitor 模式（npm run build:native）：给 APK 用。
 *   产物会被塞进 APK 里由 WebView 直接读本地文件，这时候 Service Worker 不但没用，
 *   还会把旧资源缓存住 —— 装了新版本 APK 打开还是老界面。所以原生构建里不注册 SW。
 */
export default defineConfig(({ mode }) => {
  const forNative = mode === 'capacitor'

  return {
    base: './',
    server: {
      host: true,
      port: 5173,
    },
    build: {
      target: 'es2019',
      cssTarget: 'chrome80',
      // 首屏体积优先：把 react / antd-mobile 拆开，其余小模块合进主 chunk
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'react'
              if (id.includes('antd-mobile') || id.includes('rc-')) return 'ui'
              if (id.includes('dayjs')) return 'dayjs'
              return 'vendor'
            }
          },
        },
      },
    },
    plugins: [
      react(),
      ...(forNative
        ? []
        : [
            VitePWA({
              registerType: 'autoUpdate',
              includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
              manifest: {
                name: '萤火书房',
                short_name: '萤火书房',
                description: '点亮一只萤火虫，书房就亮一点 —— 阅读习惯养成 App',
                lang: 'zh-CN',
                start_url: './',
                scope: './',
                display: 'standalone',
                orientation: 'portrait',
                background_color: '#0B1020',
                theme_color: '#0B1020',
                icons: [
                  { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                  { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                  { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
              },
              workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
                // 单页应用：离线时回退到 index.html
                navigateFallback: 'index.html',
                cleanupOutdatedCaches: true,
              },
              devOptions: { enabled: false },
            }),
          ]),
    ],
    test: {
      environment: 'node',
      include: ['src/**/*.test.js'],
    },
  }
})

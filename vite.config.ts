import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isAnalyze = process.env.ANALYZE === 'true'

  return {
    plugins: [
      react({
        // Enable React DevTools in development
        devTarget: 'es2022',
      }),
      
      // PWA Configuration
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\./,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24, // 24 hours
                },
              },
            },
          ],
        },
        manifest: {
          name: 'FrostGuard LoRaWAN Emulator',
          short_name: 'FrostGuard Emulator',
          description: 'LoRaWAN Device Emulator for Testing TTN Integration',
          theme_color: '#000000',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
      }),

      // Bundle analyzer (only when ANALYZE=true)
      ...(isAnalyze ? [{
        name: 'vite-bundle-analyzer',
        apply: 'build',
        generateBundle() {
          import('vite-bundle-analyzer').then(({ analyzer }) => {
            analyzer()
          })
        }
      }] : []),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@store': path.resolve(__dirname, './src/store'),
      },
    },

    server: {
      port: 4145,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8787',
          changeOrigin: true,
          secure: false,
        },
      },
    },

    build: {
      target: 'es2022',
      minify: 'terser',
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor'
              }
              if (id.includes('@reduxjs') || id.includes('react-redux')) {
                return 'redux-vendor'
              }
              if (id.includes('@tanstack/react-query')) {
                return 'query-vendor'
              }
              if (id.includes('@radix-ui') || id.includes('lucide-react')) {
                return 'ui-vendor'
              }
              if (id.includes('recharts')) {
                return 'charts-vendor'
              }
              return 'vendor'
            }

            // Feature-based chunks
            if (id.includes('/components/emulator/')) {
              return 'emulator'
            }
            if (id.includes('/store/')) {
              return 'store'
            }
          },
        },
      },
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        },
      },
      chunkSizeWarningLimit: 600, // Warn for chunks larger than 600kb
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@reduxjs/toolkit',
        'react-redux',
        '@tanstack/react-query',
      ],
    },

    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },

    // Performance optimization
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
    },

    preview: {
      port: 4173,
      host: true,
    },
  }
})

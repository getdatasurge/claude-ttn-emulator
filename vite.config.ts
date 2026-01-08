import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isAnalyze = process.env.ANALYZE === 'true'

  return {
    base: '/claude-ttn-emulator/',
    plugins: [
      react({
        // Enable React DevTools in development
        devTarget: 'es2022',
      }),
      
      // PWA Configuration
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['vite.svg'],
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
          scope: '/claude-ttn-emulator/',
          start_url: '/claude-ttn-emulator/',
          icons: [
            {
              src: '/claude-ttn-emulator/vite.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
            {
              src: '/claude-ttn-emulator/vite.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
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
      // Deduplicate React to prevent multiple instances
      dedupe: ['react', 'react-dom'],
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
            // Keep React and ReactDOM together - critical for hooks
            if (id.includes('node_modules/react') ||
                id.includes('node_modules/react-dom') ||
                id.includes('node_modules/scheduler')) {
              return 'vendor-react'
            }
            // Recharts is large, split it out (only used in emulator)
            if (id.includes('node_modules/recharts') ||
                id.includes('node_modules/d3-')) {
              return 'vendor-charts'
            }
            // Redux and state management
            if (id.includes('node_modules/@reduxjs') ||
                id.includes('node_modules/redux') ||
                id.includes('node_modules/react-redux') ||
                id.includes('node_modules/immer')) {
              return 'vendor-state'
            }
            // React Query
            if (id.includes('node_modules/@tanstack')) {
              return 'vendor-query'
            }
            // Combine Radix UI with forms to prevent initialization issues
            if (id.includes('node_modules/@radix-ui') ||
                id.includes('node_modules/react-hook-form') ||
                id.includes('node_modules/zod') ||
                id.includes('node_modules/@hookform')) {
              return 'vendor-ui'
            }
            // Lucide icons - can be large
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons'
            }
            // Stack Auth (optional module)
            if (id.includes('node_modules/@stackframe')) {
              return 'vendor-auth'
            }
            // JWT/crypto
            if (id.includes('node_modules/jose')) {
              return 'vendor-crypto'
            }
            // React router
            if (id.includes('node_modules/react-router') ||
                id.includes('node_modules/@remix-run')) {
              return 'vendor-router'
            }
            // Other vendor modules
            if (id.includes('node_modules/')) {
              return 'vendor-misc'
            }
          },
        },
      },
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
          // Prevent variable reuse that can cause TDZ errors
          keep_fnames: true,
        },
        mangle: {
          // Preserve function names to prevent initialization issues
          keep_fnames: true,
        },
      },
      chunkSizeWarningLimit: 500, // Lower the warning threshold
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@reduxjs/toolkit',
        'react-redux',
        '@tanstack/react-query',
        // Note: @stackframe/react is dynamically imported only when configured
        // Do NOT include it here - it causes React hook bundling issues in production
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

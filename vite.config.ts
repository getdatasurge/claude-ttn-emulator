import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
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
      target: 'es2020', // Use more compatible target
      minify: 'esbuild', // Switch to esbuild minification to avoid Terser issues
      sourcemap: true, // Enable sourcemaps for debugging production issues
      rollupOptions: {
        output: {
          // Use function-based chunking to properly handle dependencies
          manualChunks: (id) => {
            // Core React must be in its own chunk
            if (id.includes('node_modules/react/') || 
                id.includes('node_modules/react-dom/') ||
                id.includes('node_modules/scheduler/')) {
              return 'vendor-react';
            }
            
            // Router
            if (id.includes('node_modules/react-router') || 
                id.includes('node_modules/@remix-run/')) {
              return 'vendor-router';
            }
            
            // All Radix UI and its dependencies in one chunk
            // This ensures proper initialization order
            if (id.includes('node_modules/@radix-ui/') ||
                id.includes('node_modules/@floating-ui/') ||
                id.includes('node_modules/aria-hidden/') ||
                id.includes('node_modules/react-remove-scroll/')) {
              return 'vendor-ui';
            }
            
            // Forms and validation
            if (id.includes('node_modules/react-hook-form/') ||
                id.includes('node_modules/@hookform/') ||
                id.includes('node_modules/zod/')) {
              return 'vendor-forms';
            }
            
            // Other vendor modules
            if (id.includes('node_modules/')) {
              return 'vendor';
            }
          },
        },
      },
      chunkSizeWarningLimit: 600, // Increase limit slightly
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

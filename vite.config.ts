import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    // WebContainer needs cross-origin isolation (SharedArrayBuffer). These headers
    // cover `vite dev` and `vite preview`; production is covered by vercel.json.
    {
      name: 'cross-origin-isolation',
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          next();
        });
      },
      configurePreviewServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    // Monaco and three.js dominate the bundle; splitting them keeps the initial
    // workspace chunk from growing without bound.
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('monaco-editor')) return 'monaco';
          if (id.includes('/three/') || id.includes('@react-three') || id.includes('three-stdlib')) {
            return 'three';
          }
          if (id.includes('@xterm')) return 'xterm';
          if (id.includes('@supabase')) return 'supabase';
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});

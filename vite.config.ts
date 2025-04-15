import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// We'll use dynamic import for lovable-tagger since it's an ESM module

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => ({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: mode !== 'development',
    sourcemap: mode === 'development',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          radix: [
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-select',
          ],
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  },
  base: './', // Required for Electron to load assets correctly
  server: {
    port: 3003, // changed from 3002 to avoid port conflict
    host: 'localhost',
    strictPort: true, // Help with Electron specific port requirements
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3003
    }
  },
  plugins: [
    react(),
    mode === 'development' && {
      name: 'dynamic-import-lovable-tagger',
      async configResolved() {
        if (mode === 'development') {
          try {
            const { componentTagger } = await import('lovable-tagger');
            // Call the tagger but don't return its result
            componentTagger();
            // Return void explicitly to satisfy TypeScript
            return;
          } catch (error) {
            console.warn('Failed to load lovable-tagger:', error);
            return;
          }
        }
        return;
      }
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

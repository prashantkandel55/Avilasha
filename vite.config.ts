import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// We'll use dynamic import for lovable-tagger since it's an ESM module

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => ({
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  base: './',
  server: {
    port: 3001,
    host: 'localhost',
    strictPort: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3001
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

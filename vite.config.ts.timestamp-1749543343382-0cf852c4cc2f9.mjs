// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig(({ mode, command }) => ({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: mode !== "development",
    sourcemap: mode === "development",
    rollupOptions: {
      input: {
        main: path.resolve(__vite_injected_original_dirname, "index.html")
      },
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          radix: [
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-select"
          ]
        }
      }
    }
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"]
  },
  base: "./",
  // Required for Electron to load assets correctly
  server: {
    port: 3020,
    // changed from 3010 to avoid port conflict
    host: "localhost",
    strictPort: true,
    // Help with Electron specific port requirements
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 3020
    }
  },
  plugins: [
    react(),
    mode === "development" && {
      name: "dynamic-import-lovable-tagger",
      async configResolved() {
        if (mode === "development") {
          try {
            const { componentTagger } = await import("file:///home/project/node_modules/lovable-tagger/dist/index.js");
            componentTagger();
            return;
          } catch (error) {
            console.warn("Failed to load lovable-tagger:", error);
            return;
          }
        }
        return;
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG4vLyBXZSdsbCB1c2UgZHluYW1pYyBpbXBvcnQgZm9yIGxvdmFibGUtdGFnZ2VyIHNpbmNlIGl0J3MgYW4gRVNNIG1vZHVsZVxuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUsIGNvbW1hbmQgfSkgPT4gKHtcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICBtaW5pZnk6IG1vZGUgIT09ICdkZXZlbG9wbWVudCcsXG4gICAgc291cmNlbWFwOiBtb2RlID09PSAnZGV2ZWxvcG1lbnQnLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGlucHV0OiB7XG4gICAgICAgIG1haW46IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdpbmRleC5odG1sJylcbiAgICAgIH0sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgcmVhY3Q6IFsncmVhY3QnLCAncmVhY3QtZG9tJ10sXG4gICAgICAgICAgcmFkaXg6IFtcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtYWxlcnQtZGlhbG9nJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtZGlhbG9nJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtZHJvcGRvd24tbWVudScsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWxhYmVsJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3Qtc2VsZWN0JyxcbiAgICAgICAgICBdLFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ11cbiAgfSxcbiAgYmFzZTogJy4vJywgLy8gUmVxdWlyZWQgZm9yIEVsZWN0cm9uIHRvIGxvYWQgYXNzZXRzIGNvcnJlY3RseVxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiAzMDIwLCAvLyBjaGFuZ2VkIGZyb20gMzAxMCB0byBhdm9pZCBwb3J0IGNvbmZsaWN0XG4gICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSwgLy8gSGVscCB3aXRoIEVsZWN0cm9uIHNwZWNpZmljIHBvcnQgcmVxdWlyZW1lbnRzXG4gICAgaG1yOiB7XG4gICAgICBwcm90b2NvbDogJ3dzJyxcbiAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgcG9ydDogMzAyMFxuICAgIH1cbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgbW9kZSA9PT0gJ2RldmVsb3BtZW50JyAmJiB7XG4gICAgICBuYW1lOiAnZHluYW1pYy1pbXBvcnQtbG92YWJsZS10YWdnZXInLFxuICAgICAgYXN5bmMgY29uZmlnUmVzb2x2ZWQoKSB7XG4gICAgICAgIGlmIChtb2RlID09PSAnZGV2ZWxvcG1lbnQnKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHsgY29tcG9uZW50VGFnZ2VyIH0gPSBhd2FpdCBpbXBvcnQoJ2xvdmFibGUtdGFnZ2VyJyk7XG4gICAgICAgICAgICAvLyBDYWxsIHRoZSB0YWdnZXIgYnV0IGRvbid0IHJldHVybiBpdHMgcmVzdWx0XG4gICAgICAgICAgICBjb21wb25lbnRUYWdnZXIoKTtcbiAgICAgICAgICAgIC8vIFJldHVybiB2b2lkIGV4cGxpY2l0bHkgdG8gc2F0aXNmeSBUeXBlU2NyaXB0XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignRmFpbGVkIHRvIGxvYWQgbG92YWJsZS10YWdnZXI6JywgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfSxcbiAgXS5maWx0ZXIoQm9vbGVhbiksXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLE1BQU0sUUFBUSxPQUFPO0FBQUEsRUFDbEQsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBLElBQ2IsUUFBUSxTQUFTO0FBQUEsSUFDakIsV0FBVyxTQUFTO0FBQUEsSUFDcEIsZUFBZTtBQUFBLE1BQ2IsT0FBTztBQUFBLFFBQ0wsTUFBTSxLQUFLLFFBQVEsa0NBQVcsWUFBWTtBQUFBLE1BQzVDO0FBQUEsTUFDQSxRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixPQUFPLENBQUMsU0FBUyxXQUFXO0FBQUEsVUFDNUIsT0FBTztBQUFBLFlBQ0w7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUEsRUFDcEQ7QUFBQSxFQUNBLE1BQU07QUFBQTtBQUFBLEVBQ04sUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUE7QUFBQSxJQUNaLEtBQUs7QUFBQSxNQUNILFVBQVU7QUFBQSxNQUNWLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxJQUNSO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sU0FBUyxpQkFBaUI7QUFBQSxNQUN4QixNQUFNO0FBQUEsTUFDTixNQUFNLGlCQUFpQjtBQUNyQixZQUFJLFNBQVMsZUFBZTtBQUMxQixjQUFJO0FBQ0Ysa0JBQU0sRUFBRSxnQkFBZ0IsSUFBSSxNQUFNLE9BQU8sZ0VBQWdCO0FBRXpELDRCQUFnQjtBQUVoQjtBQUFBLFVBQ0YsU0FBUyxPQUFPO0FBQ2Qsb0JBQVEsS0FBSyxrQ0FBa0MsS0FBSztBQUNwRDtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0YsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K

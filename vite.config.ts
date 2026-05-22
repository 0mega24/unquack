import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { compression } from "vite-plugin-compression2";

export default defineConfig({
  appType: "spa",
  css: {
    transformer: "lightningcss",
  },
  build: {
    cssMinify: "lightningcss",
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          bangs: ["./src/bang.ts"],
        },
      },
    },
  },
  plugins: [
    compression({ algorithm: "gzip", exclude: /\.(html|webmanifest)$/ }),
    VitePWA({
      registerType: "autoUpdate",
    }),
  ],
});

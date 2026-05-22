import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { compression } from "vite-plugin-compression2";

export default defineConfig({
  appType: "spa",
  build: {
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 1600,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: "bangs", test: /\/bang\.ts/ }],
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

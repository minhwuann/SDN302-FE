import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logoApp.png"],
      manifest: {
        name: "Ví Vi Vu",
        short_name: "Vi Vu",
        description: "Sống vi vu, không lo túi - Sổ thu chi AI",
        theme_color: "#3B82F6",
        background_color: "#0F172A",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/logoApp.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // Force SW to activate immediately on new deployment
        skipWaiting: true,
        clientsClaim: true,
        // Cache tất cả assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Không cache API động (REST Backend) trong service worker để tránh dữ liệu cũ
        runtimeCaching: [],
      },
    }),
  ],
  server: {
    // Cấu hình header để cho phép Popup hoạt động
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["@heroui/react", "framer-motion", "lucide-react"],
          "chart-vendor": ["recharts"],
          "utils-vendor": ["date-fns", "xlsx", "file-saver"],
          "ai-vendor": ["@google/generative-ai", "@google/genai"],
        },
      },
    },
    // Tăng warning limit lên nếu cần thiết
    chunkSizeWarningLimit: 1000,
  },
});

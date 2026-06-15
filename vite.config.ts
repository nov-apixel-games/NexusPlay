import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "script",
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,json,woff,woff2,ttf}"],
          globIgnores: [
            "**/node_modules/**/*",
            "assets/AdminPanel*.js",
            "assets/three-core*.js",
            "assets/three-fiber*.js",
            "assets/GameStudioEditor3D*.js",
            "assets/NexusAIChat*.js",
            "**/*.glb",
            "**/*.gltf",
            "**/*.mp3",
            "**/*.wav",
          ],
          maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
          navigateFallback: "/index.html",
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "cloudinary-images",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/.*\.supabase\.(co|js)\/rest\/v1\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-api-cache",
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 24 * 60 * 60, // 24 hours offline fallback
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: "module",
          navigateFallback: "index.html",
        },
        manifest: {
          name: "NexusPlay",
          short_name: "NexusPlay",
          description: "Una web offline-first y plataforma de juegos HTML5",
          theme_color: "#000000",
          background_color: "#000000",
          display: "standalone",
          start_url: "/",
          orientation: "portrait",
          icons: [
            {
              src: "https://res.cloudinary.com/dpp9889/image/upload/w_192,h_192,c_fill/v1/logos/nexus_logo.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "https://res.cloudinary.com/dpp9889/image/upload/w_512,h_512,c_fill/v1/logos/nexus_logo.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "https://res.cloudinary.com/dpp9889/image/upload/w_192,h_192,c_fill/v1/logos/nexus_logo.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "https://res.cloudinary.com/dpp9889/image/upload/w_512,h_512,c_fill/v1/logos/nexus_logo.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
      }),
    ],
    define: {},
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
      dedupe: ["react", "react-dom"],
    },
    build: {
      chunkSizeWarningLimit: 2500,
      rollupOptions: {
        output: {
          manualChunks: {
            "three-core": ["three"],
            "three-fiber": ["@react-three/fiber", "@react-three/drei"],
            "react-vendor": ["react", "react-dom"],
            lucide: ["lucide-react"],
            supabase: ["@supabase/supabase-js"],
            recharts: ["recharts"],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});

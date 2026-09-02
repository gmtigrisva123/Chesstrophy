import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Resolve against this file's own location rather than process.cwd(), so the
// config works no matter which directory the dev server is launched from.
const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: rootDir,

  plugins: [react()],

  resolve: {
    alias: { "@": path.resolve(rootDir, "src") },
  },

  server: {
    // Honour PORT so container/CI/preview harnesses can assign a free port.
    port: Number(process.env.PORT) || 5173,
  },

  preview: {
    port: Number(process.env.PORT) || 4173,
  },

  build: {
    outDir: path.resolve(rootDir, "dist"),
    sourcemap: true,
    // Ship every image as its own fingerprinted file instead of inlining small
    // ones as base64. The piece sprites are used by every board in the app, so
    // a long-lived cache entry beats saving twelve requests on first load.
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: {
          // React changes far less often than app code; keeping it in its own
          // chunk means a normal deploy does not invalidate it in user caches.
          "react-vendor": ["react", "react-dom"],
        },
      },
    },
  },

  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.js"],
    include: ["src/**/*.test.{js,jsx}", "tests/**/*.test.{js,jsx}"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "coverage",
      include: ["src/**/*.{js,jsx}"],
      exclude: [
        "src/**/*.test.{js,jsx}",
        "src/assets/**",
        "src/data/**",
        "src/main.jsx",
      ],
    },
  },
});

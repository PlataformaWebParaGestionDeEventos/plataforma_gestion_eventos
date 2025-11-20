/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./Tests/setupTests.js",
    css: true,
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "Tests/",
        "dist/",
        "**/*.test.{js,jsx}",
        "**/*.spec.{js,jsx}",
        "src/main.jsx",
        "src/config/credenciales.js",
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": "/src",
      "@components": "/src/components",
      "@services": "/src/services",
      "@hooks": "/src/core/hooks",
      "@utils": "/src/core/utils",
      "@config": "/src/config",
    },
  },
});

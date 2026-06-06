import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [],
  base: process.env.BASE || "/",
  resolve: {
    alias: {
      "@domain": fileURLToPath(new URL("./src/domain", import.meta.url)),
      "@application": fileURLToPath(new URL("./src/application", import.meta.url)),
      "@infrastructure": fileURLToPath(new URL("./src/infrastructure", import.meta.url)),
      "@ui": fileURLToPath(new URL("./src/ui", import.meta.url)),
      "@shared": fileURLToPath(new URL("./src/shared", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
  build: {
    outDir: "dist",
  },
});

import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GITHUB_PAGES_BASE is provided by the workflow, e.g. /forge/.
// This separate browser-only build needs no server or hosting credentials.
export default defineConfig({
  base: process.env.GITHUB_PAGES_BASE || "/",
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  build: { outDir: "dist-pages" },
});

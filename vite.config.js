import { defineConfig } from "vite";

export default defineConfig({
  root: ".",       // project root
  base: "./",      // relative paths (so it works on GitHub pages too)
  build: {
    outDir: "dist",  // build output
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: true,
  },
});

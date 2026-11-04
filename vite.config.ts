import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: {
    port: 5173,
    proxy: {
      // API_PORT lets the API run elsewhere when 4000 is taken (must match PORT for the server).
      "/api": { target: `http://localhost:${process.env.API_PORT ?? 4000}`, changeOrigin: true },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
});

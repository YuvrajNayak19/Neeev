import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ command }) => {
  // The API's .env sets NODE_ENV=development; without this the client build would bundle React's
  // development runtime (~300 kB larger and slower).
  const isBuild = command === "build";

  return {
    plugins: [react()],
    define: isBuild ? { "process.env.NODE_ENV": JSON.stringify("production") } : undefined,
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
    server: {
      port: 5173,
      proxy: {
        // API_PORT lets the API run elsewhere when 4000 is taken (must match PORT for the server).
        "/api": { target: `http://localhost:${process.env.API_PORT ?? 4000}`, changeOrigin: true },
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          // Long-lived vendor chunk so app updates don't re-download React.
          manualChunks: { react: ["react", "react-dom", "react-router-dom"] },
        },
      },
    },
  };
});

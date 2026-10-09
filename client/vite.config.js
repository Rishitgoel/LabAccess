import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: { "/api": "http://127.0.0.1:3001" },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("/node_modules/react/") ||
            id.includes("/node_modules/react-dom/") ||
            id.includes("/node_modules/react-router") ||
            id.includes("\\node_modules\\react\\") ||
            id.includes("\\node_modules\\react-dom\\") ||
            id.includes("\\node_modules\\react-router")
          ) {
            return "vendor-react";
          }
          if (
            id.includes("/node_modules/motion") ||
            id.includes("\\node_modules\\motion")
          ) {
            return "vendor-motion";
          }
          if (
            id.includes("/node_modules/radix-ui") ||
            id.includes("\\node_modules\\radix-ui") ||
            id.includes("/node_modules/@radix-ui") ||
            id.includes("\\node_modules\\@radix-ui")
          ) {
            return "vendor-radix";
          }
        },
      },
    },
  },
});

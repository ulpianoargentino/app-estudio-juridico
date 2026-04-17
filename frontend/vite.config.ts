import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const localZod = path.resolve(__dirname, "./node_modules/zod");
const sharedDir = path.resolve(__dirname, "../shared");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: path.resolve(__dirname, "./src/$1") },
      { find: /^@shared$/, replacement: path.resolve(sharedDir, "index.ts") },
      { find: /^@shared\/(.*)$/, replacement: path.resolve(sharedDir, "$1") },
      // shared/ vive fuera de frontend/; cuando sus archivos importan "zod/v4",
      // Vite no puede caminar hasta frontend/node_modules, así que lo mapeamos
      // explícitamente al paquete local.
      { find: /^zod$/, replacement: localZod },
      { find: /^zod\/(.*)$/, replacement: path.resolve(localZod, "$1") },
    ],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});

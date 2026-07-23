import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendPort = env.PORT || "8791";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      // Proxy chat API to the local backend so the browser never hits
      // localhost:8787 (Cursor IDE binds that port on 127.0.0.1).
      proxy: {
        "/v1": {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
        },
        "/health": {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});

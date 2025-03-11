import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => {
  const config = {
    plugins: [react()],
    base: "/",
    server: {
      port: 5273, // Change this to the desired port
    },
  };

  if (command !== "serve") {
    config.base = "/";
  }

  return config;
});

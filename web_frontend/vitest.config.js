import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  test: {
    environment: "jsdom",  // Enable JSDOM for DOM APIs like document
    globals: true,         // Optional: lets you skip importing test, expect etc.
  },
});

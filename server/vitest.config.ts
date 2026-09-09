import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 120_000,
    hookTimeout: 60_000,
    env: {
      NODE_ENV: "test",
    },
  },
  resolve: {
    alias: { "@shared": new URL("../shared", import.meta.url).pathname },
  },
});

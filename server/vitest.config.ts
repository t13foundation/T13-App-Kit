import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

/**
 * Loads server/.env.test when present. The file is git-ignored and holds
 * locally generated development secrets only — never production values.
 */
function loadTestEnv(): Record<string, string> {
  const path = new URL(".env.test", import.meta.url).pathname;
  if (!existsSync(path)) return { NODE_ENV: "test" };
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  out["NODE_ENV"] = "test";
  return out;
}

export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 120_000,
    hookTimeout: 60_000,
    env: loadTestEnv(),
  },
  resolve: {
    alias: { "@shared": new URL("../shared", import.meta.url).pathname },
  },
});

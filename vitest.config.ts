import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": rootDir } },
  test: {
    environment: "jsdom",
    // Windows: the default "forks" pool fails to spawn workers when the repo
    // path contains spaces; "threads" runs in-process and avoids that spawn.
    pool: "threads",
    setupFiles: ["./tests/setup.ts"],
    include: [
      "lib/**/*.test.{ts,tsx}",
      "components/**/*.test.{ts,tsx}",
      "tests/**/*.test.{ts,tsx}",
    ],
    exclude: ["node_modules/**", "nuxt_sunpyramids/**", ".next/**"],
  },
});
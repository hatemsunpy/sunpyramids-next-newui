import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(".") } },
  test: { environment: "node", pool: "threads", maxWorkers: 1,
    include: ["qa/voice/integration.test.ts"] },
});

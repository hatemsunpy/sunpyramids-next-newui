import { defineConfig } from "vitest/config";

export default defineConfig({ test: { environment: "node", pool: "threads",
  maxWorkers: 1, include: ["qa/voice/replay-asr.test.ts"] } });

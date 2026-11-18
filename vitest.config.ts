import { defineConfig } from "vitest/config";
import path from "path";

// Server and package tests (node environment). The client has its own Vite config.
export default defineConfig({
  resolve: {
    alias: {
      "@civwatch/types": path.resolve(__dirname, "packages/types/src/index.ts"),
      "@civwatch/core": path.resolve(__dirname, "packages/core/src/index.ts"),
      "@civwatch/config": path.resolve(__dirname, "packages/config/src/index.ts"),
      "@civwatch/ui": path.resolve(__dirname, "packages/ui/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "packages/*/src/**/*.test.ts"],
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: ["server/**/*.ts", "packages/core/src/**/*.ts", "packages/ui/src/view-cone.ts"],
      exclude: ["**/*.test.ts", "server/index.ts", "server/db/migrations/**"],
      reporter: ["text-summary", "text"],
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 75 },
    },
  },
});

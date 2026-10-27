import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Next's server-only guard throws outside a React Server environment.
      "server-only": path.resolve(__dirname, "tests/server-only-stub.ts"),
    },
  },
});

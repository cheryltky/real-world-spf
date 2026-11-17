import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: { include: ["js/model.js", "js/params.js", "js/random.js", "js/hash.js", "js/describe.js", "js/svg.js"], thresholds: { lines: 80, functions: 80, branches: 80 } }
  }
});

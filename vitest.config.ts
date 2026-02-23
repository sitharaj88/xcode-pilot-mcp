import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    {
      name: "resolve-js-to-ts",
      enforce: "pre",
      async resolveId(source, importer, options) {
        if (!importer || !source.endsWith(".js") || !source.startsWith(".")) {
          return null;
        }
        const tsSource = source.replace(/\.js$/, ".ts");
        const resolved = await this.resolve(tsSource, importer, {
          ...options,
          skipSelf: true,
        });
        return resolved || null;
      },
    },
  ],
  test: {
    globals: true,
    testTimeout: 10000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/templates/**"],
      thresholds: {
        statements: 15,
      },
    },
  },
});

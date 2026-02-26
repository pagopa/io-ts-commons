import pagopaConfig from "@pagopa/eslint-config";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";

export default defineConfig([
  globalIgnores([
    "**/node_modules/**",
    "**/generated/**",
    "**/__tests__/**",
    "**/__mocks__/**",
    "**/typings-checker/**",
    "**/Dangerfile.*",
    "**/*.d.ts",
    "coverage/**",
    "docs/**",
    "lib/**",
    "eslintrc.config.mjs",
  ]),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      sourceType: "module",
    },
  },
  ...pagopaConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: "tsconfig.json",
      },
    },
  },
]);

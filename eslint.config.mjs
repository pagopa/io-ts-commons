import pagopaConfig from "@pagopa/eslint-config";
import extraRules from "eslint-plugin-extra-rules";
import functional from "eslint-plugin-functional";
import * as pluginImport from "eslint-plugin-import";
import preferArrow from "eslint-plugin-prefer-arrow";
import sonarjs from "eslint-plugin-sonarjs";
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
  {
    plugins: {
      "extra-rules": extraRules,
      functional,
      import: pluginImport,
      "prefer-arrow": preferArrow,
      sonarjs,
    },
    rules: {
      // Ignore variables/args whose name starts with _ (intentionally unused)
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
]);

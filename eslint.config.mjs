import pagopaConfig from "@pagopa/eslint-config";
import functional from "eslint-plugin-functional";
import * as pluginImport from "eslint-plugin-import";
import jsdoc from "eslint-plugin-jsdoc";
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
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      functional,
      import: pluginImport,
      jsdoc,
      "prefer-arrow": preferArrow,
      sonarjs,
    },
    rules: {
      "@typescript-eslint/adjacent-overload-signatures": "error",
      "@typescript-eslint/array-type": [
        "error",
        {
          default: "array-simple",
          readonly: "generic",
        },
      ],
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/consistent-type-assertions": "error",
      "@typescript-eslint/consistent-type-definitions": "error",
      "@typescript-eslint/dot-notation": "error",
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/explicit-member-accessibility": [
        "error",
        {
          accessibility: "explicit",
          overrides: {
            constructors: "no-public",
          },
        },
      ],
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/member-ordering": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          format: ["PascalCase", "camelCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
          selector: "variable",
          trailingUnderscore: "allow",
        },
        {
          format: ["PascalCase"],
          selector: "typeLike",
        },
        {
          format: ["PascalCase", "camelCase", "UPPER_CASE", "snake_case"],
          leadingUnderscore: "allow",
          selector: "property",
          trailingUnderscore: "forbid",
        },
        {
          format: ["PascalCase"],
          prefix: ["I"],
          selector: "interface",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-namespace": "error",
      "@typescript-eslint/no-restricted-types": [
        "error",
        {
          types: {
            Boolean: {
              message:
                "Avoid using the `Boolean` type. Did you mean `boolean`?",
            },
            Function: {
              message:
                "Avoid using the `Function` type. Prefer a specific function type, like `() => void`.",
            },
            Number: {
              message: "Avoid using the `Number` type. Did you mean `number`?",
            },
            Object: {
              message: "Avoid using the `Object` type. Did you mean `object`?",
            },
            String: {
              message: "Avoid using the `String` type. Did you mean `string`?",
            },
            Symbol: {
              message: "Avoid using the `Symbol` type. Did you mean `symbol`?",
            },
          },
        },
      ],
      "@typescript-eslint/no-shadow": [
        "error",
        {
          hoist: "all",
        },
      ],
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-unused-expressions": ["error"],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-use-before-define": "error",
      "@typescript-eslint/prefer-for-of": "error",
      "@typescript-eslint/prefer-function-type": "error",
      "@typescript-eslint/prefer-namespace-keyword": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/restrict-plus-operands": "error",
      "@typescript-eslint/triple-slash-reference": [
        "error",
        {
          lib: "always",
          path: "always",
          types: "prefer-import",
        },
      ],
      "@typescript-eslint/unified-signatures": "error",
      "arrow-body-style": "error",
      complexity: "error",
      "constructor-super": "error",
      curly: "error",
      "default-case": "error",
      eqeqeq: ["error", "smart"],
      "functional/immutable-data": "error",
      "functional/no-let": "error",
      "functional/prefer-property-signatures": "error",
      "functional/prefer-readonly-type": "error",
      "guard-for-in": "error",
      "id-denylist": [
        "error",
        "any",
        "Number",
        "number",
        "String",
        "string",
        "Boolean",
        "boolean",
        "Undefined",
        "undefined",
      ],
      "id-match": "error",
      "import/no-internal-modules": "off",
      "jsdoc/check-alignment": "error",
      "max-classes-per-file": ["error", 1],
      "max-lines-per-function": ["error", 200],
      "max-params": ["error", 5],
      "no-bitwise": "error",
      "no-caller": "error",
      "no-case-declarations": "off",
      "no-console": "error",
      "no-eval": "error",
      "no-inner-declarations": "off",
      // Enable if we want to enforce the return type for all the functions
      "no-invalid-this": "error",
      "no-multi-str": "error",
      "no-new-wrappers": "error",
      "no-param-reassign": "error",
      "no-shadow": "off",
      "no-throw-literal": "error",
      "no-undef-init": "error",
      "no-underscore-dangle": "error",
      "no-unused-expressions": "off",
      "no-useless-return": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "one-var": ["error", "never"],
      "prefer-arrow/prefer-arrow-functions": "error",
      "prefer-const": "error",
      radix: "error",
      semi: "off",
      "sonarjs/cognitive-complexity": ["error", 19],
      "sonarjs/no-duplicate-string": "error",
      "sonarjs/no-inverted-boolean-check": "error",
      "sonarjs/no-small-switch": "error",
      "sort-keys": "error",
      "spaced-comment": ["error", "always", { block: { balanced: true } }],
    },
  },
]);

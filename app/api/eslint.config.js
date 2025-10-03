// eslint.config.js

import globals from 'globals';
import js from '@eslint/js';
import ts from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
// import path from "node:path";
// import { fileURLToPath } from "node:url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
export default ts.config(
  // 1. Base ESLint Recommended Rules
  js.configs.recommended,

  // 2. TypeScript Recommended Rules
  ...ts.configs.recommended,

  // 3. Project-specific Overrides and Custom Rules
  {
    languageOptions: {
      globals: {
        ...globals.node, // Add Node.js global variables (like 'process')
      },
      parserOptions: {
        // project: [path.join(__dirname, 'tsconfig.json')],
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    files: ['**/*.{js,ts}'],
    rules: {
      // Custom Rules (Examples)
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Too strict for Express controllers
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' }, // Allows prefixing arguments with _ to ignore them
      ],
      // Allow async functions in the main API file (index.ts)
      '@typescript-eslint/no-floating-promises': 'off',

      // Enforce the use of interfaces over types for object definition
      // '@typescript-eslint/consistent-type-definitions': ['error', 'interface']
    },
  },

  // 4. Prettier Integration (Must be last!)
  // Turns off all ESLint rules that are unnecessary or conflict with Prettier
  prettierConfig
);

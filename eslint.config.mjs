import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    'dist/',
    'coverage/',
    'docs/.vitepress/cache/',
    'docs/.vitepress/dist/',
    'examples/*/dist/',
    '.superpowers/',
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    files: ['test/consumer/*.test.cjs'],
    languageOptions: { globals: globals.jest },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]);

import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ['**/build', '**/dist'],
  },
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier: prettierPlugin,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 12,
      sourceType: 'module',
    },
    rules: {
      // possible-errors
      'no-console': [1],

      // best-practices
      curly: [2],
      'default-case': [1],
      'default-case-last': [1],
      eqeqeq: [1, 'always'],
      'no-multi-spaces': [1],
      'no-alert': [1],

      // variables
      'no-undef-init': [2],

      // stylistic-issues
      'array-bracket-newline': [1, 'consistent'],
      'brace-style': [2],
      camelcase: [
        2,
        {
          properties: 'always',
        },
      ],
      'comma-spacing': [
        1,
        {
          before: false,
          after: true,
        },
      ],

      'eol-last': [2, 'always'],
      'object-curly-newline': [
        1,
        {
          consistent: true,
        },
      ],
      'object-curly-spacing': [1, 'always'],
      quotes: [1, 'single'],
      semi: [1, 'always'],
      'semi-style': [2, 'last'],
      'no-nested-ternary': [1],
      'no-unneeded-ternary': [2],
      'no-whitespace-before-property': [2],
      'no-trailing-spaces': [
        1,
        {
          skipBlankLines: true,
        },
      ],
      'no-multiple-empty-lines': [
        2,
        {
          max: 1,
          maxEOF: 0,
          maxBOF: 0,
        },
      ],

      // es 6
      'arrow-spacing': [
        1,
        {
          before: true,
          after: true,
        },
      ],
      'no-duplicate-imports': [1],

      // prettier rules
      ...prettierConfig.rules,
      'prettier/prettier': 'warn',
    },
  },
];

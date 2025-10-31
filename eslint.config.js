import eslintParser from '@typescript-eslint/parser';
import plugin from './dist/index.js';

export default [
  {
    files: ['example.ts'],
    languageOptions: {
      parser: eslintParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      'ts-no-unnecessary': plugin,
    },
    rules: {
      'ts-no-unnecessary/no-unnecessary-optional-chaining-and-coalesce': 'error',
    },
  },
];

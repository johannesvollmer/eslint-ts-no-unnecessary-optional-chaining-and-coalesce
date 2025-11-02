import eslintParser from '@typescript-eslint/parser';
import plugin from 'eslint-ts-no-unnecessary-optional-chaining-and-coalesce';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
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

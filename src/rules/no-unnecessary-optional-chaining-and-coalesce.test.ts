import { ESLintUtils } from '@typescript-eslint/utils';
import rule from '../rules/no-unnecessary-optional-chaining-and-coalesce';
import * as path from 'path';

const ruleTester = new ESLintUtils.RuleTester({
  languageOptions: {
    parser: require('@typescript-eslint/parser'),
    parserOptions: {
      project: './tsconfig.test.json',
      tsconfigRootDir: path.join(__dirname, '../..'),
    },
  },
});

ruleTester.run('no-unnecessary-optional-chaining-and-coalesce', rule, {
  valid: [
    // Optional chaining is necessary when type can be nullish
    {
      code: `
        const obj: { prop: string } | null = Math.random() > 0.5 ? { prop: 'test' } : null;
        const value = obj?.prop;
      `,
    },
    {
      code: `
        const obj: { prop: string } | undefined = Math.random() > 0.5 ? { prop: 'test' } : undefined;
        const value = obj?.prop;
      `,
    },
    // Nullish coalescing is necessary when value can be nullish
    {
      code: `
        const value: string | null = Math.random() > 0.5 ? 'test' : null;
        const result = value ?? 'fallback';
      `,
    },
    {
      code: `
        const value: string | undefined = Math.random() > 0.5 ? 'test' : undefined;
        const result = value ?? 'fallback';
      `,
    },
    // Optional call is necessary when function can be nullish
    {
      code: `
        const fn: (() => string) | null = Math.random() > 0.5 ? () => 'test' : null;
        const result = fn?.();
      `,
    },
  ],
  invalid: [
    // Unnecessary optional chaining on non-nullish value
    {
      code: `
        const obj: { prop: string } = { prop: 'test' };
        const value = obj?.prop;
      `,
      errors: [{ messageId: 'unnecessaryOptionalChain' }],
    },
    // Unnecessary optional chaining on call result
    {
      code: `
        function getObj(): { prop: string } {
          return { prop: 'test' };
        }
        const value = getObj()?.prop;
      `,
      errors: [{ messageId: 'unnecessaryOptionalChain' }],
    },
    // Unnecessary nullish coalescing on non-nullish value
    {
      code: `
        const value: string = 'test';
        const result = value ?? 'fallback';
      `,
      errors: [{ messageId: 'unnecessaryNullishCoalesce' }],
    },
    // Unnecessary nullish coalescing on call result
    {
      code: `
        function getValue(): string {
          return 'test';
        }
        const result = getValue() ?? 'fallback';
      `,
      errors: [{ messageId: 'unnecessaryNullishCoalesce' }],
    },
    // Unnecessary optional chaining on number
    {
      code: `
        const num: number = 42;
        const obj: any = { prop: num };
        const value = obj?.prop;
      `,
      errors: [{ messageId: 'unnecessaryOptionalChain' }],
    },
    // Multiple unnecessary operations
    {
      code: `
        const str: string = 'hello';
        const result1 = str ?? 'fallback';
        const obj: { name: string } = { name: 'test' };
        const result2 = obj?.name;
      `,
      errors: [
        { messageId: 'unnecessaryNullishCoalesce' },
        { messageId: 'unnecessaryOptionalChain' },
      ],
    },
  ],
});

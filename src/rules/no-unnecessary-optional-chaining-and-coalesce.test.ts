import path from 'path';
import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../rules/no-unnecessary-optional-chaining-and-coalesce';

// Configure RuleTester afterAll for Jest compatibility
RuleTester.afterAll = afterAll;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require('@typescript-eslint/parser'),
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      project: './tsconfig.test.json',
      tsconfigRootDir: path.join(__dirname, '../..'),
      EXPERIMENTAL_useProjectService: {
        allowDefaultProjectForFiles: ['*.ts', '**/*.ts'],
      },
    },
  },
} as any);

describe('no-unnecessary-optional-chaining-and-coalesce', () => {
  ruleTester.run('no-unnecessary-optional-chaining-and-coalesce', rule, {
    valid: [
      // Valid: Optional chaining with nullable types
      {
        code: `
          const obj: { prop: string } | null = null;
          const value = obj?.prop;
        `,
        filename: 'valid1.ts',
      },
      {
        code: `
          const obj: { prop: string } | undefined = undefined;
          const value = obj?.prop;
        `,
        filename: 'valid2.ts',
      },
      {
        code: `
          const obj: { prop: string } | null | undefined = null;
          const value = obj?.prop;
        `,
        filename: 'valid3.ts',
      },
      // Valid: Nullish coalescing with nullable types
      {
        code: `
          const str: string | null = null;
          const result = str ?? 'fallback';
        `,
        filename: 'valid4.ts',
      },
      {
        code: `
          const str: string | undefined = undefined;
          const result = str ?? 'fallback';
        `,
        filename: 'valid5.ts',
      },
      {
        code: `
          const str: string | null | undefined = null;
          const result = str ?? 'fallback';
        `,
        filename: 'valid6.ts',
      },
      // Valid: Optional chaining with any type
      {
        code: `
          const anyValue: any = getValue();
          const result = anyValue?.prop;
        `,
        filename: 'valid7.ts',
      },
      // Valid: Nullish coalescing with any type
      {
        code: `
          const anyValue: any = getValue();
          const result = anyValue ?? 'fallback';
        `,
        filename: 'valid8.ts',
      },
      // Valid: Optional chaining with unknown type
      {
        code: `
          const unknownValue: unknown = getValue();
          const result = unknownValue ?? 'fallback';
        `,
        filename: 'valid9.ts',
      },
      // Valid: Optional call with nullable function
      {
        code: `
          const fn: (() => string) | null = null;
          const result = fn?.();
        `,
        filename: 'valid10.ts',
      },
      {
        code: `
          const fn: (() => string) | undefined = undefined;
          const result = fn?.();
        `,
        filename: 'valid11.ts',
      },
      // Valid: Union types that include null/undefined
      {
        code: `
          type MaybeString = string | null;
          const value: MaybeString = 'test';
          const result = value ?? 'default';
        `,
        filename: 'valid12.ts',
      },
      // Valid: Function returning nullable type
      {
        code: `
          function getNullable(): string | null {
            return null;
          }
          const result = getNullable() ?? 'fallback';
        `,
        filename: 'valid13.ts',
      },
    ],
    invalid: [
      // Invalid: Optional chaining on non-nullable object
      {
        code: `
          const obj: { prop: string } = { prop: 'test' };
          const value = obj?.prop;
        `,
        filename: 'invalid1.ts',
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      // Invalid: Nullish coalescing on non-nullable string
      {
        code: `
          const str: string = 'hello';
          const result = str ?? 'fallback';
        `,
        filename: 'invalid2.ts',
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
        ],
      },
      // Invalid: Optional chaining on guaranteed object
      {
        code: `
          interface MyInterface {
            prop: string;
          }
          const obj: MyInterface = { prop: 'value' };
          const result = obj?.prop;
        `,
        filename: 'invalid3.ts',
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      // Invalid: Nullish coalescing on guaranteed number
      {
        code: `
          const num: number = 42;
          const result = num ?? 0;
        `,
        filename: 'invalid4.ts',
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
        ],
      },
      // Invalid: Optional call on guaranteed function
      {
        code: `
          function getObj(): { prop: string } {
            return { prop: 'test' };
          }
          const value = getObj()?.prop;
        `,
        filename: 'invalid5.ts',
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      // Invalid: Multiple unnecessary optional chains
      {
        code: `
          const obj: { nested: { value: string } } = { nested: { value: 'test' } };
          const result = obj?.nested?.value;
        `,
        filename: 'invalid6.ts',
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      // Invalid: Nullish coalescing on guaranteed boolean
      {
        code: `
          const bool: boolean = true;
          const result = bool ?? false;
        `,
        filename: 'invalid7.ts',
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
        ],
      },
      // Invalid: Optional chaining on literal object
      {
        code: `
          const value = { x: 1, y: 2 }?.x;
        `,
        filename: 'invalid8.ts',
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      // Invalid: Nullish coalescing on literal string
      {
        code: `
          const result = 'literal' ?? 'fallback';
        `,
        filename: 'invalid9.ts',
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
        ],
      },
      // Invalid: Optional call on guaranteed function reference
      {
        code: `
          const fn: () => number = () => 42;
          const result = fn?.();
        `,
        filename: 'invalid10.ts',
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
    ],
  });
});


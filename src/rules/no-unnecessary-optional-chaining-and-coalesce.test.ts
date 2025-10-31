// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - TypeScript has trouble resolving the module, but it works at runtime
import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../rules/no-unnecessary-optional-chaining-and-coalesce';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - TypeScript module resolution issue
import * as parser from '@typescript-eslint/parser';

// Configure RuleTester afterAll for Jest compatibility
RuleTester.afterAll = afterAll;

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      EXPERIMENTAL_useProjectService: {
        allowDefaultProjectForFiles: ['./**/*.ts'],
        defaultProject: './tsconfig.json',
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
      },
      {
        code: `
          const obj: { prop: string } | undefined = undefined;
          const value = obj?.prop;
        `,
      },
      {
        code: `
          const obj: { prop: string } | null | undefined = null;
          const value = obj?.prop;
        `,
      },
      // Valid: Nullish coalescing with nullable types
      {
        code: `
          const str: string | null = null;
          const result = str ?? 'fallback';
        `,
      },
      {
        code: `
          const str: string | undefined = undefined;
          const result = str ?? 'fallback';
        `,
      },
      {
        code: `
          const str: string | null | undefined = null;
          const result = str ?? 'fallback';
        `,
      },
      // Valid: Optional chaining with any type
      {
        code: `
          const anyValue: any = getValue();
          const result = anyValue?.prop;
        `,
      },
      // Valid: Nullish coalescing with any type
      {
        code: `
          const anyValue: any = getValue();
          const result = anyValue ?? 'fallback';
        `,
      },
      // Valid: Optional chaining with unknown type
      {
        code: `
          const unknownValue: unknown = getValue();
          const result = unknownValue ?? 'fallback';
        `,
      },
      // Valid: Optional call with nullable function
      {
        code: `
          const fn: (() => string) | null = null;
          const result = fn?.();
        `,
      },
      {
        code: `
          const fn: (() => string) | undefined = undefined;
          const result = fn?.();
        `,
      },
      // Valid: Union types that include null/undefined
      {
        code: `
          type MaybeString = string | null;
          const value: MaybeString = 'test';
          const result = value ?? 'default';
        `,
      },
      // Valid: Function returning nullable type
      {
        code: `
          function getNullable(): string | null {
            return null;
          }
          const result = getNullable() ?? 'fallback';
        `,
      },
    ],
    invalid: [
      // Invalid: Optional chaining on non-nullable object
      {
        code: `
          const obj: { prop: string } = { prop: 'test' };
          const value = obj?.prop;
        `,
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
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
    ],
  });
});


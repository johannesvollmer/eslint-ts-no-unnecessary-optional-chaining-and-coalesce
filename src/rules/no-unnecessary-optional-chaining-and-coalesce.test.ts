import path from 'path';
import { RuleTester } from '@typescript-eslint/rule-tester';
import parser from '@typescript-eslint/parser';
import rule from '../rules/no-unnecessary-optional-chaining-and-coalesce';

// Configure RuleTester afterAll for Jest compatibility
RuleTester.afterAll = afterAll;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: parser as any,
    parserOptions: {
      projectService: {
        allowDefaultProject: ['*.ts*'],
        maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 50,
      },
      tsconfigRootDir: path.join(__dirname, '../..'),
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
          declare const value: MaybeString;
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
      {
        code: `
          export interface ActionBarItem {
            isVisible?: boolean | (() => boolean)
          }

          function isActionVisible(action: ActionBarItem): boolean {
            if (typeof action.isVisible === 'function') {
              return action.isVisible();
            }
            return action.isVisible ?? false;
          }
        `,
        filename: 'actionbar.ts',
      },
      {
        code: `
          const localization: null | { value: string|null } = null as any;
          const result = localization?.value ?? "xyz"
        `,
        filename: 'localization.ts',
      },
      {
        code: `
          type T = { x?: string };
          let obj: T;
          const result = obj.x?.length;
        `,
        filename: 't.ts',
      },
      {
        code: `
          function identity<T>(): T {
            return T ?? '0';
          }
        `,
        filename: 'generic.ts',
      },
    ],
    invalid: [
      // Invalid: Optional chaining on non-nullable object
      {
        code: `
          const obj: { prop: string } = { prop: 'test' };
          const value = obj?.prop;
        `,
        output: `
          const obj: { prop: string } = { prop: 'test' };
          const value = obj.prop;
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
        output: `
          const str: string = 'hello';
          const result = str;
        `,
        filename: 'invalid2.ts',
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
        ],
      },

      // the array member is always present, so the chaining array access is unnecessary:
      {
        code: `
          const poi: { categories: ({id?:string,sourceCategory?:string}|null)[] } = {} as any;
          const categoryId = poi.categories?.[0]?.id ?? poi.categories?.[0]?.sourceCategory ?? '';
        `,
        output: `
          const poi: { categories: ({id?:string,sourceCategory?:string}|null)[] } = {} as any;
          const categoryId = poi.categories[0]?.id ?? poi.categories[0]?.sourceCategory ?? '';
        `,
        filename: 'invalid_deep_array1.ts',
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },

      {
        code: `
          const x: { selectedCategoryName: string } = {} as any;
          const s = x.selectedCategoryName?.toLowerCase?.() === 'favorites';
        `,
        output: [
          `
          const x: { selectedCategoryName: string } = {} as any;
          const s = x.selectedCategoryName.toLowerCase?.() === 'favorites';
        `,
          `
          const x: { selectedCategoryName: string } = {} as any;
          const s = x.selectedCategoryName.toLowerCase() === 'favorites';
        `,
        ],
        filename: 'invalid_deep_method1.ts',
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },

      {
        code: `
          const isDark = globalThis.matchMedia?.('dark')?.matches ?? false;
        `,
        output: `
          const isDark = globalThis.matchMedia('dark')?.matches ?? false;
        `,
        filename: 'invalid_call2.ts',
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
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
        output: `
          interface MyInterface {
            prop: string;
          }
          const obj: MyInterface = { prop: 'value' };
          const result = obj.prop;
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
        output: `
          const num: number = 42;
          const result = num;
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
        output: `
          function getObj(): { prop: string } {
            return { prop: 'test' };
          }
          const value = getObj().prop;
        `,
        filename: 'invalid5.ts',
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      // Invalid: Multiple unnecessary optional chains (autofix applied iteratively in multiple passes)
      {
        code: `
          const obj: { nested: { value: string } } = { nested: { value: 'test' } };
          const result = obj?.nested?.value;
        `,
        output: [
          `
          const obj: { nested: { value: string } } = { nested: { value: 'test' } };
          const result = obj.nested?.value;
        `,
          `
          const obj: { nested: { value: string } } = { nested: { value: 'test' } };
          const result = obj.nested.value;
        `,
        ],
        filename: 'invalid6.ts',
        errors: [
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
        output: `
          const bool: boolean = true;
          const result = bool;
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
        output: `
          const value = { x: 1, y: 2 }.x;
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
        output: `
          const result = 'literal';
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
        output: `
          const fn: () => number = () => 42;
          const result = fn();
        `,
        filename: 'invalid10.ts',
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      // Invalid: Nested optional chaining - all unnecessary (autofix applied iteratively in multiple passes)
      {
        code: `
          const obj: { a: { b: { c: string } } } = { a: { b: { c: 'value' } } };
          const result = obj?.a?.b?.c;
        `,
        output: [
          `
          const obj: { a: { b: { c: string } } } = { a: { b: { c: 'value' } } };
          const result = obj.a?.b?.c;
        `,
          `
          const obj: { a: { b: { c: string } } } = { a: { b: { c: 'value' } } };
          const result = obj.a.b?.c;
        `,
          `
          const obj: { a: { b: { c: string } } } = { a: { b: { c: 'value' } } };
          const result = obj.a.b.c;
        `,
        ],
        filename: 'invalid11.ts',
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      // Invalid: Deeply nested optional chaining (autofix applied iteratively in multiple passes)
      {
        code: `
          const obj: { x: { y: { z: number } } } = { x: { y: { z: 42 } } };
          const value = obj?.x?.y?.z;
        `,
        output: [
          `
          const obj: { x: { y: { z: number } } } = { x: { y: { z: 42 } } };
          const value = obj.x?.y?.z;
        `,
          `
          const obj: { x: { y: { z: number } } } = { x: { y: { z: 42 } } };
          const value = obj.x.y?.z;
        `,
          `
          const obj: { x: { y: { z: number } } } = { x: { y: { z: 42 } } };
          const value = obj.x.y.z;
        `,
        ],
        filename: 'invalid12.ts',
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      // Invalid: Chained with function call (autofix applied iteratively in multiple passes)
      {
        code: `
          function getObj(): { prop: { nested: string } } {
            return { prop: { nested: 'test' } };
          }
          const value = getObj()?.prop?.nested;
        `,
        output: [
          `
          function getObj(): { prop: { nested: string } } {
            return { prop: { nested: 'test' } };
          }
          const value = getObj().prop?.nested;
        `,
          `
          function getObj(): { prop: { nested: string } } {
            return { prop: { nested: 'test' } };
          }
          const value = getObj().prop.nested;
        `,
        ],
        filename: 'invalid13.ts',
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      // Invalid: Chained optional chaining with array access (fixes one at a time, outermost first like other chains)
      {
        code: `
          const arr: { items: string[] } = { items: ['a', 'b'] };
          const item = arr?.items?.[0];
        `,
        output: [
          `
          const arr: { items: string[] } = { items: ['a', 'b'] };
          const item = arr.items?.[0];
        `,
          `
          const arr: { items: string[] } = { items: ['a', 'b'] };
          const item = arr.items[0];
        `,
        ],
        filename: 'invalid14.ts',
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      // Invalid: Multiple nullish coalescing - only outer gets fixed first
      {
        code: `
          const str: string = 'hello';
          const result = (str ?? 'fallback1') ?? 'fallback2';
        `,
        output: [
          `
          const str: string = 'hello';
          const result = str ?? 'fallback1';
        `,
          `
          const str: string = 'hello';
          const result = str;
        `,
        ],
        filename: 'invalid15.ts',
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
        ],
      },
      // Invalid: Nullish coalescing with object property
      {
        code: `
          const obj: { value: number } = { value: 10 };
          const result = obj.value ?? 0;
        `,
        output: `
          const obj: { value: number } = { value: 10 };
          const result = obj.value;
        `,
        filename: 'invalid16.ts',
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
        ],
      },
      // Invalid: Mixed - optional chaining followed by nullish coalescing (both get fixed separately)
      {
        code: `
          const obj: { prop: string } = { prop: 'test' };
          const result = obj?.prop ?? 'fallback';
        `,
        output: [
          `
          const obj: { prop: string } = { prop: 'test' };
          const result = obj.prop ?? 'fallback';
        `,
          `
          const obj: { prop: string } = { prop: 'test' };
          const result = obj.prop;
        `,
        ],
        filename: 'invalid17.ts',
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      // Invalid: Complex chained expression (autofix applied iteratively in multiple passes)
      {
        code: `
          interface Config {
            settings: {
              options: {
                value: number;
              };
            };
          }
          const config: Config = { settings: { options: { value: 100 } } };
          const val = config?.settings?.options?.value;
        `,
        output: [
          `
          interface Config {
            settings: {
              options: {
                value: number;
              };
            };
          }
          const config: Config = { settings: { options: { value: 100 } } };
          const val = config.settings?.options?.value;
        `,
          `
          interface Config {
            settings: {
              options: {
                value: number;
              };
            };
          }
          const config: Config = { settings: { options: { value: 100 } } };
          const val = config.settings.options?.value;
        `,
          `
          interface Config {
            settings: {
              options: {
                value: number;
              };
            };
          }
          const config: Config = { settings: { options: { value: 100 } } };
          const val = config.settings.options.value;
        `,
        ],
        filename: 'invalid19.ts',
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
    ],
  });

  // Test that error messages include type information via string interpolation
  ruleTester.run('error messages include type information', rule, {
    valid: [],
    invalid: [
      {
        code: `
          const str: string = 'test';
          const result = str?.length;
        `,
        output: `
          const str: string = 'test';
          const result = str.length;
        `,
        filename: 'message-test1.ts',
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
            data: { type: 'string' },
          },
        ],
      },
      {
        code: `
          const num: number = 42;
          const result = num ?? 0;
        `,
        output: `
          const num: number = 42;
          const result = num;
        `,
        filename: 'message-test2.ts',
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
            data: { type: 'number' },
          },
        ],
      },
      {
        code: `
          const obj: { prop: string } = { prop: 'test' };
          const value = obj?.prop;
        `,
        output: `
          const obj: { prop: string } = { prop: 'test' };
          const value = obj.prop;
        `,
        filename: 'message-test3.ts',
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
            data: { type: '{ prop: string; }' },
          },
        ],
      },
      {
        code: `
          const fn: () => number = () => 42;
          const result = fn?.();
        `,
        output: `
          const fn: () => number = () => 42;
          const result = fn();
        `,
        filename: 'message-test4.ts',
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
            data: { type: '() => number' },
          },
        ],
      },
    ],
  });
});



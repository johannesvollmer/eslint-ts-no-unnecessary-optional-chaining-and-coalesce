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
        maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 100,
      },
      tsconfigRootDir: path.join(__dirname, '../..'),
    },
  },
} as any);

describe('no-unnecessary-optional-chaining-and-coalesce', () => {
  ruleTester.run('no-unnecessary-optional-chaining-and-coalesce', rule, {
    valid: [
      {
        filename: 'valid-optional-chaining-with-nullable-types.ts',
        code: `
          const obj: { prop: string } | null = null;
          const value = obj?.prop;
        `,
      },
      {
        filename: 'valid-optional-chaining-with-undefined-type.ts',
        code: `
          const obj: { prop: string } | undefined = undefined;
          const value = obj?.prop;
        `,
      },
      {
        filename: 'valid-optional-chaining-with-null-or-undefined-type.ts',
        code: `
          const obj: { prop: string } | null | undefined = null;
          const value = obj?.prop;
        `,
      },
      {
        filename: 'valid-nullish-coalescing-with-nullable-types.ts',
        code: `
          const str: string | null = null;
          const result = str ?? 'fallback';
        `,
      },
      {
        filename: 'valid-nullish-coalescing-with-undefined-type.ts',
        code: `
          const str: string | undefined = undefined;
          const result = str ?? 'fallback';
        `,
      },
      {
        filename: 'valid-nullish-coalescing-with-null-or-undefined-type.ts',
        code: `
          const str: string | null | undefined = null;
          const result = str ?? 'fallback';
        `,
      },
      {
        filename: 'valid-optional-chaining-with-any-type.ts',
        code: `
          const anyValue: any = getValue();
          const result = anyValue?.prop;
        `,
      },
      {
        filename: 'valid-nullish-coalescing-with-any-type.ts',
        code: `
          const anyValue: any = getValue();
          const result = anyValue ?? 'fallback';
        `,
      },
      {
        filename: 'valid-optional-chaining-with-unknown-type.ts',
        code: `
          const unknownValue: unknown = getValue();
          const result = unknownValue ?? 'fallback';
        `,
      },
      {
        filename: 'valid-optional-call-with-nullable-function.ts',
        code: `
          const fn: (() => string) | null = null;
          const result = fn?.();
        `,
      },
      {
        filename: 'valid-optional-call-with-undefined-function.ts',
        code: `
          const fn: (() => string) | undefined = undefined;
          const result = fn?.();
        `,
      },
      {
        filename: 'valid-union-types-that-include-nullundefined.ts',
        code: `
          type MaybeString = string | null;
          declare const value: MaybeString;
          const result = value ?? 'default';
        `,
      },
      {
        filename: 'valid-function-returning-nullable-type.ts',
        code: `
          function getNullable(): string | null {
            return null;
          }
          const result = getNullable() ?? 'fallback';
        `,
      },
      {
        filename: 'valid-optional-property-with-type-narrowing.ts',
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
      },
      {
        filename: 'valid-chained-optional-and-coalescing-with-nullable.ts',
        code: `
          const localization: null | { value: string|null } = null as any;
          const result = localization?.value ?? "xyz"
        `,
      },
      {
        filename: 'valid-optional-property-chaining.ts',
        code: `
          type T = { x?: string };
          let obj: T;
          const result = obj.x?.length;
        `,
      },
      {
        filename: 'valid-generic-type-parameter.ts',
        code: `
          function identity<T>(): T {
            return T ?? '0';
          }
        `,
      },
    ],
    invalid: [
      {
        filename: 'invalid-optional-chaining-on-non-nullable-object.ts',
        code: `
          const obj: { prop: string } = { prop: 'test' };
          const value = obj?.prop;
        `,
        output: `
          const obj: { prop: string } = { prop: 'test' };
          const value = obj.prop;
        `,
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      {
        filename: 'invalid-nullish-coalescing-on-non-nullable-string.ts',
        code: `
          const str: string = 'hello';
          const result = str ?? 'fallback';
        `,
        output: `
          const str: string = 'hello';
          const result = str;
        `,
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
        ],
      },

      {
        filename: 'the-array-member-is-always-present-so-the-chaining-array-access-is-unnecessary.ts',
        code: `
          const poi: { categories: ({id?:string,sourceCategory?:string}|null)[] } = {} as any;
          const categoryId = poi.categories?.[0]?.id ?? poi.categories?.[0]?.sourceCategory ?? '';
        `,
        output: `
          const poi: { categories: ({id?:string,sourceCategory?:string}|null)[] } = {} as any;
          const categoryId = poi.categories[0]?.id ?? poi.categories[0]?.sourceCategory ?? '';
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

      {
        filename: 'invalid-chained-method-call-with-optional-operators.ts',
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
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },

      {
        filename: 'invalid-multiple-operators-with-global-function.ts',
        code: `
          const isDark = globalThis.matchMedia?.('dark')?.matches ?? false;
        `,
        output: [
          `
          const isDark = globalThis.matchMedia('dark')?.matches ?? false;
        `,
          `
          const isDark = globalThis.matchMedia('dark').matches ?? false;
        `,
          `
          const isDark = globalThis.matchMedia('dark').matches;
        `,
        ],
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },

      {
        filename: 'invalid-optional-chaining-on-guaranteed-object.ts',
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
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      {
        filename: 'invalid-nullish-coalescing-on-guaranteed-number.ts',
        code: `
          const num: number = 42;
          const result = num ?? 0;
        `,
        output: `
          const num: number = 42;
          const result = num;
        `,
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
        ],
      },
      {
        filename: 'invalid-optional-call-on-guaranteed-function.ts',
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
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      {
        filename: 'invalid-multiple-unnecessary-optional-chains-autofix-applied-iteratively-in-multiple-passes.ts',
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
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      {
        filename: 'invalid-nullish-coalescing-on-guaranteed-boolean.ts',
        code: `
          const bool: boolean = true;
          const result = bool ?? false;
        `,
        output: `
          const bool: boolean = true;
          const result = bool;
        `,
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
        ],
      },
      {
        filename: 'invalid-optional-chaining-on-literal-object.ts',
        code: `
          const value = { x: 1, y: 2 }?.x;
        `,
        output: `
          const value = { x: 1, y: 2 }.x;
        `,
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      {
        filename: 'invalid-nullish-coalescing-on-literal-string.ts',
        code: `
          const result = 'literal' ?? 'fallback';
        `,
        output: `
          const result = 'literal';
        `,
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
        ],
      },
      {
        filename: 'invalid-optional-call-on-guaranteed-function-reference.ts',
        code: `
          const fn: () => number = () => 42;
          const result = fn?.();
        `,
        output: `
          const fn: () => number = () => 42;
          const result = fn();
        `,
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      {
        filename: 'invalid-nested-optional-chaining-all-unnecessary-autofix-applied-iteratively-in-multiple-passes.ts',
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
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      {
        filename: 'invalid-deeply-nested-optional-chaining-autofix-applied-iteratively-in-multiple-passes.ts',
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
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      {
        filename: 'invalid-chained-with-function-call-autofix-applied-iteratively-in-multiple-passes.ts',
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
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      {
        filename: 'invalid-chained-optional-chaining-with-array-access-fixes-one-at-a-time-outermost-first-like-other-chains.ts',
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
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      {
        filename: 'invalid-multiple-nullish-coalescing-only-outer-gets-fixed-first.ts',
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
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
        ],
      },
      {
        filename: 'invalid-nullish-coalescing-with-object-property.ts',
        code: `
          const obj: { value: number } = { value: 10 };
          const result = obj.value ?? 0;
        `,
        output: `
          const obj: { value: number } = { value: 10 };
          const result = obj.value;
        `,
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
        ],
      },
      {
        filename: 'invalid-mixed-optional-chaining-followed-by-nullish-coalescing-both-get-fixed-separately.ts',
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
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      {
        filename: 'invalid-complex-chained-expression-autofix-applied-iteratively-in-multiple-passes.ts',
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
        filename: 'error-message-with-string-type.ts',
        code: `
          const str: string = 'test';
          const result = str?.length;
        `,
        output: `
          const str: string = 'test';
          const result = str.length;
        `,
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
            data: { type: 'string' },
          },
        ],
      },
      {
        filename: 'error-message-with-number-type.ts',
        code: `
          const num: number = 42;
          const result = num ?? 0;
        `,
        output: `
          const num: number = 42;
          const result = num;
        `,
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
            data: { type: 'number' },
          },
        ],
      },
      {
        filename: 'error-message-with-object-type.ts',
        code: `
          const obj: { prop: string } = { prop: 'test' };
          const value = obj?.prop;
        `,
        output: `
          const obj: { prop: string } = { prop: 'test' };
          const value = obj.prop;
        `,
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
            data: { type: '{ prop: string; }' },
          },
        ],
      },
      {
        filename: 'error-message-with-function-type.ts',
        code: `
          const fn: () => number = () => 42;
          const result = fn?.();
        `,
        output: `
          const fn: () => number = () => 42;
          const result = fn();
        `,
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
            data: { type: '() => number' },
          },
        ],
      },
    ],
  });

  // Test exotic type scenarios
  ruleTester.run('exotic type scenarios', rule, {
    valid: [
      {
        filename: 'valid-intersection-type-with-nullable-component.ts',
        code: `
          type A = { a: string };
          type B = { b: number };
          type C = A & B;
          const obj: C | null = null;
          const value = obj?.a;
        `,
      },
      {
        filename: 'valid-conditional-type-that-can-be-nullish.ts',
        code: `
          type Maybe<T> = T extends string ? T | null : T;
          const val: Maybe<string> = null;
          const result = val ?? 'default';
        `,
      },
      {
        filename: 'valid-deeply-nested-nullable-type.ts',
        code: `
          type Deep = { l1: { l2: { l3: { l4: { l5: string } } } } } | null;
          const obj: Deep = null;
          const result = obj?.l1?.l2?.l3?.l4?.l5;
        `,
      },
      {
        filename: 'valid-logical-or-with-nullable.ts',
        code: `
          const str: string | null = null;
          const result = str?.length || 0;
        `,
      },
      {
        filename: 'valid-logical-and-with-nullable.ts',
        code: `
          const obj: { prop: string } | null = null;
          const result = obj && obj.prop;
        `,
      },
    ],
    invalid: [
      {
        filename: 'invalid-intersection-type-both-components-non-nullable.ts',
        code: `
          type A = { a: string };
          type B = { b: number };
          type C = A & B;
          const obj: C = { a: 'test', b: 42 };
          const value = obj?.a;
        `,
        output: `
          type A = { a: string };
          type B = { b: number };
          type C = A & B;
          const obj: C = { a: 'test', b: 42 };
          const value = obj.a;
        `,
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      {
        filename: 'invalid-conditional-type-that-resolves-to-non-nullable.ts',
        code: `
          type NonNull<T> = T extends null ? never : T;
          const val: NonNull<string> = 'test';
          const result = val ?? 'default';
        `,
        output: `
          type NonNull<T> = T extends null ? never : T;
          const val: NonNull<string> = 'test';
          const result = val;
        `,
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
        ],
      },
      {
        filename: 'invalid-very-deep-nesting-all-non-nullable-autofix-applied-iteratively.ts',
        code: `
          type Deep = { l1: { l2: { l3: { l4: { l5: { l6: string } } } } } };
          const obj: Deep = { l1: { l2: { l3: { l4: { l5: { l6: 'deep' } } } } } };
          const result = obj?.l1?.l2?.l3?.l4?.l5?.l6;
        `,
        output: [
          `
          type Deep = { l1: { l2: { l3: { l4: { l5: { l6: string } } } } } };
          const obj: Deep = { l1: { l2: { l3: { l4: { l5: { l6: 'deep' } } } } } };
          const result = obj.l1?.l2?.l3?.l4?.l5?.l6;
        `,
          `
          type Deep = { l1: { l2: { l3: { l4: { l5: { l6: string } } } } } };
          const obj: Deep = { l1: { l2: { l3: { l4: { l5: { l6: 'deep' } } } } } };
          const result = obj.l1.l2?.l3?.l4?.l5?.l6;
        `,
          `
          type Deep = { l1: { l2: { l3: { l4: { l5: { l6: string } } } } } };
          const obj: Deep = { l1: { l2: { l3: { l4: { l5: { l6: 'deep' } } } } } };
          const result = obj.l1.l2.l3?.l4?.l5?.l6;
        `,
          `
          type Deep = { l1: { l2: { l3: { l4: { l5: { l6: string } } } } } };
          const obj: Deep = { l1: { l2: { l3: { l4: { l5: { l6: 'deep' } } } } } };
          const result = obj.l1.l2.l3.l4?.l5?.l6;
        `,
          `
          type Deep = { l1: { l2: { l3: { l4: { l5: { l6: string } } } } } };
          const obj: Deep = { l1: { l2: { l3: { l4: { l5: { l6: 'deep' } } } } } };
          const result = obj.l1.l2.l3.l4.l5?.l6;
        `,
          `
          type Deep = { l1: { l2: { l3: { l4: { l5: { l6: string } } } } } };
          const obj: Deep = { l1: { l2: { l3: { l4: { l5: { l6: 'deep' } } } } } };
          const result = obj.l1.l2.l3.l4.l5.l6;
        `,
        ],
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      {
        filename: 'invalid-deeply-nested-operators-mix-of-and.ts',
        code: `
          const obj: { a: { b: { c: number } } } = { a: { b: { c: 5 } } };
          const result = (obj?.a?.b?.c ?? 0) ?? 1;
        `,
        output: [
          `
          const obj: { a: { b: { c: number } } } = { a: { b: { c: 5 } } };
          const result = obj?.a?.b?.c ?? 0;
        `,
          `
          const obj: { a: { b: { c: number } } } = { a: { b: { c: 5 } } };
          const result = obj.a?.b?.c ?? 0;
        `,
          `
          const obj: { a: { b: { c: number } } } = { a: { b: { c: 5 } } };
          const result = obj.a.b?.c ?? 0;
        `,
          `
          const obj: { a: { b: { c: number } } } = { a: { b: { c: 5 } } };
          const result = obj.a.b.c ?? 0;
        `,
          `
          const obj: { a: { b: { c: number } } } = { a: { b: { c: 5 } } };
          const result = obj.a.b.c;
        `,
        ],
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      {
        filename: 'invalid-logical-or-with-non-nullable-is-not-checked-by-this-rule-but-is.ts',
        code: `
          const str: string = 'hello';
          const result = str?.length || 0;
        `,
        output: `
          const str: string = 'hello';
          const result = str.length || 0;
        `,
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      {
        filename: 'invalid-logical-and-with-non-nullable.ts',
        code: `
          const obj: { prop: string } = { prop: 'test' };
          const result = obj && obj?.prop;
        `,
        output: `
          const obj: { prop: string } = { prop: 'test' };
          const result = obj && obj.prop;
        `,
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      {
        filename: 'invalid-plus-operation-with-nullish-coalescing.ts',
        code: `
          const a: number = 5;
          const b: number = 10;
          const result = (a ?? 0) + (b ?? 0);
        `,
        output: `
          const a: number = 5;
          const b: number = 10;
          const result = (a) + (b);
        `,
        errors: [
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
        ],
      },
      {
        filename: 'invalid-complex-expression-with-string-concatenation-and-multiple-operators.ts',
        code: `
          const obj: { val: number } = { val: 42 };
          const fallback: string = 'default';
          const result = (obj?.val + ' - ') + (fallback ?? 'none');
        `,
        output: `
          const obj: { val: number } = { val: 42 };
          const fallback: string = 'default';
          const result = (obj.val + ' - ') + (fallback);
        `,
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
        ],
      },
      {
        filename: 'invalid-intersection-type-with-array-access.ts',
        code: `
          type HasArray = { items: string[] };
          type HasCount = { count: number };
          type Both = HasArray & HasCount;
          const obj: Both = { items: ['a', 'b'], count: 2 };
          const first = obj?.items?.[0];
        `,
        output: [
          `
          type HasArray = { items: string[] };
          type HasCount = { count: number };
          type Both = HasArray & HasCount;
          const obj: Both = { items: ['a', 'b'], count: 2 };
          const first = obj.items?.[0];
        `,
          `
          type HasArray = { items: string[] };
          type HasCount = { count: number };
          type Both = HasArray & HasCount;
          const obj: Both = { items: ['a', 'b'], count: 2 };
          const first = obj.items[0];
        `,
        ],
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      {
        filename: 'invalid-conditional-type-in-chain.ts',
        code: `
          type ExtractValue<T> = T extends { value: infer V } ? V : never;
          type MyType = { value: { nested: string } };
          const obj: ExtractValue<MyType> = { nested: 'test' };
          const result = obj?.nested;
        `,
        output: `
          type ExtractValue<T> = T extends { value: infer V } ? V : never;
          type MyType = { value: { nested: string } };
          const obj: ExtractValue<MyType> = { nested: 'test' };
          const result = obj.nested;
        `,
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
      {
        filename: 'invalid-deep-nesting-with-logical-or.ts',
        code: `
          const obj: { a: { b: number } } = { a: { b: 10 } };
          const multiplier: number = 2;
          const result = (obj?.a?.b * (multiplier ?? 1)) || 0;
        `,
        output: [
          `
          const obj: { a: { b: number } } = { a: { b: 10 } };
          const multiplier: number = 2;
          const result = (obj.a?.b * (multiplier)) || 0;
        `,
          `
          const obj: { a: { b: number } } = { a: { b: 10 } };
          const multiplier: number = 2;
          const result = (obj.a.b * (multiplier)) || 0;
        `,
        ],
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
          {
            messageId: 'unnecessaryNullishCoalesce',
          },
        ],
      },
      {
        filename: 'invalid-chain-with-function-calls-and-arithmetic.ts',
        code: `
          function getNum(): number { return 5; }
          const obj: { multiply: (n: number) => number } = { multiply: (n) => n * 2 };
          const result = obj?.multiply?.(getNum()) + 10;
        `,
        output: [
          `
          function getNum(): number { return 5; }
          const obj: { multiply: (n: number) => number } = { multiply: (n) => n * 2 };
          const result = obj.multiply?.(getNum()) + 10;
        `,
          `
          function getNum(): number { return 5; }
          const obj: { multiply: (n: number) => number } = { multiply: (n) => n * 2 };
          const result = obj.multiply(getNum()) + 10;
        `,
        ],
        errors: [
          {
            messageId: 'unnecessaryOptionalChain',
          },
        ],
      },
    ],
  });

  ruleTester.run('unnecessary null or undefined conversion in coalescing', rule, {
    valid: [
      {
        filename: 'can-be-both-null-and-undefined-coalesce-undefined.ts',
        code: `
          const x: string | null | undefined = null;
          const result = x ?? undefined;
        `,
      },
      {
        filename: 'can-be-both-null-and-undefined-coalesce-null.ts',
        code: `
          const x: string | null | undefined = undefined;
          const result = x ?? null;
        `,
      },
      {
        filename: 'can-be-null-not-undefined-coalesce-undefined.ts',
        code: `
          const x: string | null = null;
          const result = x ?? undefined;
        `,
      },
      {
        filename: 'can-be-undefined-not-null-coalesce-null.ts',
        code: `
          const x: string | undefined = undefined;
          const result = x ?? null;
        `,
      },
      {
        filename: 'coalesce-with-non-nullish-fallback-null.ts',
        code: `
          const x: string | null = null;
          const result = x ?? 'fallback';
        `,
      },
      {
        filename: 'coalesce-with-non-nullish-fallback-undefined.ts',
        code: `
          const x: string | undefined = undefined;
          const result = x ?? 0;
        `,
      },
    ],
    invalid: [
      {
        filename: 'can-be-undefined-not-null-coalesce-undefined.ts',
        code: `
          const x: string | undefined = undefined;
          const result = x ?? undefined;
        `,
        output: `
          const x: string | undefined = undefined;
          const result = x;
        `,
        errors: [
          {
            messageId: 'unnecessaryNullToUndefinedConversion',
          },
        ],
      },
      {
        filename: 'can-be-null-not-undefined-coalesce-null.ts',
        code: `
          const x: string | null = null;
          const result = x ?? null;
        `,
        output: `
          const x: string | null = null;
          const result = x;
        `,
        errors: [
          {
            messageId: 'unnecessaryUndefinedToNullConversion',
          },
        ],
      },
      {
        filename: 'optional-property-can-only-be-undefined.ts',
        code: `
          interface Config {
            value?: string;
          }
          const config: Config = {};
          const result = config.value ?? undefined;
        `,
        output: `
          interface Config {
            value?: string;
          }
          const config: Config = {};
          const result = config.value;
        `,
        errors: [
          {
            messageId: 'unnecessaryNullToUndefinedConversion',
          },
        ],
      },
      {
        filename: 'function-returning-only-null.ts',
        code: `
          function getNullable(): string | null {
            return null;
          }
          const result = getNullable() ?? null;
        `,
        output: `
          function getNullable(): string | null {
            return null;
          }
          const result = getNullable();
        `,
        errors: [
          {
            messageId: 'unnecessaryUndefinedToNullConversion',
          },
        ],
      },
      {
        filename: 'nested-expression-with-undefined.ts',
        code: `
          type MaybeString = string | undefined;
          const value: MaybeString = undefined;
          const fallback: string = 'test';
          const result = (value ?? undefined) ?? fallback;
        `,
        output: `
          type MaybeString = string | undefined;
          const value: MaybeString = undefined;
          const fallback: string = 'test';
          const result = (value) ?? fallback;
        `,
        errors: [
          {
            messageId: 'unnecessaryNullToUndefinedConversion',
          },
        ],
      },
      {
        filename: 'complex-type-with-only-undefined.ts',
        code: `
          type T = { x?: number };
          const obj: T = {};
          const result = obj.x ?? undefined;
        `,
        output: `
          type T = { x?: number };
          const obj: T = {};
          const result = obj.x;
        `,
        errors: [
          {
            messageId: 'unnecessaryNullToUndefinedConversion',
          },
        ],
      },
      {
        filename: 'multiple-unnecessary-coalescing-with-undefined.ts',
        code: `
          const x: string | undefined = undefined;
          const result = (x ?? undefined) ?? undefined;
        `,
        output: [
          `
          const x: string | undefined = undefined;
          const result = x ?? undefined;
        `,
          `
          const x: string | undefined = undefined;
          const result = x;
        `,
        ],
        errors: [
          {
            messageId: 'unnecessaryNullToUndefinedConversion',
          },
          {
            messageId: 'unnecessaryNullToUndefinedConversion',
          },
        ],
      },
      {
        filename: 'multiple-unnecessary-coalescing-with-null.ts',
        code: `
          const x: string | null = null;
          const result = (x ?? null) ?? null;
        `,
        output: [
          `
          const x: string | null = null;
          const result = x ?? null;
        `,
          `
          const x: string | null = null;
          const result = x;
        `,
        ],
        errors: [
          {
            messageId: 'unnecessaryUndefinedToNullConversion',
          },
          {
            messageId: 'unnecessaryUndefinedToNullConversion',
          },
        ],
      },
      {
        filename: 'parenthesized-expression.ts',
        code: `
          const x: string | undefined = undefined;
          const y = 10;
          const result = (x ?? undefined) + y;
        `,
        output: `
          const x: string | undefined = undefined;
          const y = 10;
          const result = (x) + y;
        `,
        errors: [
          {
            messageId: 'unnecessaryNullToUndefinedConversion',
          },
        ],
      },
    ],
  });
});



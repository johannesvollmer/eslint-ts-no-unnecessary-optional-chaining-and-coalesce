"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rule_tester_1 = require("@typescript-eslint/rule-tester");
var no_unnecessary_optional_chaining_and_coalesce_1 = require("../rules/no-unnecessary-optional-chaining-and-coalesce");
var path = require("path");
// Configure RuleTester afterAll for Jest compatibility
rule_tester_1.RuleTester.afterAll = afterAll;
var ruleTester = new rule_tester_1.RuleTester({
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: path.join(__dirname, '../../tsconfig.test.json'),
        tsconfigRootDir: path.join(__dirname, '../..'),
    },
});
describe('no-unnecessary-optional-chaining-and-coalesce', function () {
    ruleTester.run('no-unnecessary-optional-chaining-and-coalesce', no_unnecessary_optional_chaining_and_coalesce_1.default, {
        valid: [
            // Valid: Optional chaining with nullable types
            {
                code: "\n          const obj: { prop: string } | null = null;\n          const value = obj?.prop;\n        ",
            },
            {
                code: "\n          const obj: { prop: string } | undefined = undefined;\n          const value = obj?.prop;\n        ",
            },
            {
                code: "\n          const obj: { prop: string } | null | undefined = null;\n          const value = obj?.prop;\n        ",
            },
            // Valid: Nullish coalescing with nullable types
            {
                code: "\n          const str: string | null = null;\n          const result = str ?? 'fallback';\n        ",
            },
            {
                code: "\n          const str: string | undefined = undefined;\n          const result = str ?? 'fallback';\n        ",
            },
            {
                code: "\n          const str: string | null | undefined = null;\n          const result = str ?? 'fallback';\n        ",
            },
            // Valid: Optional chaining with any type
            {
                code: "\n          const anyValue: any = getValue();\n          const result = anyValue?.prop;\n        ",
            },
            // Valid: Nullish coalescing with any type
            {
                code: "\n          const anyValue: any = getValue();\n          const result = anyValue ?? 'fallback';\n        ",
            },
            // Valid: Optional chaining with unknown type
            {
                code: "\n          const unknownValue: unknown = getValue();\n          const result = unknownValue ?? 'fallback';\n        ",
            },
            // Valid: Optional call with nullable function
            {
                code: "\n          const fn: (() => string) | null = null;\n          const result = fn?.();\n        ",
            },
            {
                code: "\n          const fn: (() => string) | undefined = undefined;\n          const result = fn?.();\n        ",
            },
            // Valid: Union types that include null/undefined
            {
                code: "\n          type MaybeString = string | null;\n          const value: MaybeString = 'test';\n          const result = value ?? 'default';\n        ",
            },
            // Valid: Function returning nullable type
            {
                code: "\n          function getNullable(): string | null {\n            return null;\n          }\n          const result = getNullable() ?? 'fallback';\n        ",
            },
        ],
        invalid: [
            // Invalid: Optional chaining on non-nullable object
            {
                code: "\n          const obj: { prop: string } = { prop: 'test' };\n          const value = obj?.prop;\n        ",
                errors: [
                    {
                        messageId: 'unnecessaryOptionalChain',
                    },
                ],
            },
            // Invalid: Nullish coalescing on non-nullable string
            {
                code: "\n          const str: string = 'hello';\n          const result = str ?? 'fallback';\n        ",
                errors: [
                    {
                        messageId: 'unnecessaryNullishCoalesce',
                    },
                ],
            },
            // Invalid: Optional chaining on guaranteed object
            {
                code: "\n          interface MyInterface {\n            prop: string;\n          }\n          const obj: MyInterface = { prop: 'value' };\n          const result = obj?.prop;\n        ",
                errors: [
                    {
                        messageId: 'unnecessaryOptionalChain',
                    },
                ],
            },
            // Invalid: Nullish coalescing on guaranteed number
            {
                code: "\n          const num: number = 42;\n          const result = num ?? 0;\n        ",
                errors: [
                    {
                        messageId: 'unnecessaryNullishCoalesce',
                    },
                ],
            },
            // Invalid: Optional call on guaranteed function
            {
                code: "\n          function getObj(): { prop: string } {\n            return { prop: 'test' };\n          }\n          const value = getObj()?.prop;\n        ",
                errors: [
                    {
                        messageId: 'unnecessaryOptionalChain',
                    },
                ],
            },
            // Invalid: Multiple unnecessary optional chains
            {
                code: "\n          const obj: { nested: { value: string } } = { nested: { value: 'test' } };\n          const result = obj?.nested?.value;\n        ",
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
                code: "\n          const bool: boolean = true;\n          const result = bool ?? false;\n        ",
                errors: [
                    {
                        messageId: 'unnecessaryNullishCoalesce',
                    },
                ],
            },
            // Invalid: Optional chaining on literal object
            {
                code: "\n          const value = { x: 1, y: 2 }?.x;\n        ",
                errors: [
                    {
                        messageId: 'unnecessaryOptionalChain',
                    },
                ],
            },
            // Invalid: Nullish coalescing on literal string
            {
                code: "\n          const result = 'literal' ?? 'fallback';\n        ",
                errors: [
                    {
                        messageId: 'unnecessaryNullishCoalesce',
                    },
                ],
            },
            // Invalid: Optional call on guaranteed function reference
            {
                code: "\n          const fn: () => number = () => 42;\n          const result = fn?.();\n        ",
                errors: [
                    {
                        messageId: 'unnecessaryOptionalChain',
                    },
                ],
            },
        ],
    });
});

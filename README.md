# eslint-ts-no-unnecessary-optional-chaining-and-coalesce

ESLint rule that flags `.?` and `??` usages where values will never be nullish according to TypeScript type inference.

## Installation

```bash
npm install --save-dev eslint-ts-no-unnecessary-optional-chaining-and-coalesce
```

## Requirements

- ESLint 8.x
- TypeScript 5.x
- @typescript-eslint/parser 8.x

## Usage

Add the plugin to your ESLint configuration file (e.g., `eslint.config.js` for flat config):

```javascript
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
```

For legacy `.eslintrc` format:

```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "plugins": ["eslint-ts-no-unnecessary-optional-chaining-and-coalesce"],
  "rules": {
    "eslint-ts-no-unnecessary-optional-chaining-and-coalesce/no-unnecessary-optional-chaining-and-coalesce": "error"
  }
}
```

## What it detects

This rule detects the following patterns when TypeScript infers the value is never nullish:

### Unnecessary Optional Chaining

```typescript
// ❌ Bad - obj is never null/undefined
const obj: { prop: string } = { prop: 'test' };
const value = obj?.prop;

// ✅ Good
const value = obj.prop;

// ✅ Good - optional chaining is necessary
const nullableObj: { prop: string } | null = getObj();
const value = nullableObj?.prop;
```

### Unnecessary Nullish Coalescing

```typescript
// ❌ Bad - str is never null/undefined
const str: string = 'hello';
const result = str ?? 'fallback';

// ✅ Good
const result = str;

// ✅ Good - nullish coalescing is necessary
const nullableStr: string | null = getStr();
const result = nullableStr ?? 'fallback';
```

### Unnecessary Optional Call

```typescript
// ❌ Bad - fn is never null/undefined
function getObj(): { prop: string } {
  return { prop: 'test' };
}
const value = getObj()?.prop;

// ✅ Good
const value = getObj().prop;

// ✅ Good - optional call is necessary
const nullableFn: (() => string) | null = getFn();
const result = nullableFn?.();
```

### Handling `any` and `unknown` Types

The rule correctly treats `any` and `unknown` types as potentially nullish, since they can contain null or undefined values:

```typescript
// ✅ Good - any can be null/undefined
const anyValue: any = getValue();
const result1 = anyValue?.prop;
const result2 = anyValue ?? 'fallback';

// ✅ Good - unknown can be null/undefined
const unknownValue: unknown = getValue();
const result = unknownValue ?? 'fallback';
```

## Why use this rule?

- **Type Safety**: Ensures your code accurately reflects TypeScript's type inference
- **Code Clarity**: Removes unnecessary defensive programming that can mislead readers
- **Performance**: Eliminates unnecessary runtime checks
- **Best Practices**: Promotes cleaner, more maintainable TypeScript code

## Note on Auto-Fix

This rule supports ESLint's `--fix` option to automatically remove unnecessary optional chaining (`?.`) and nullish coalescing (`??`) operators.

When you run ESLint with the `--fix` flag, the rule will:
- Remove unnecessary `?.` and replace it with `.` for member access
- Remove unnecessary `?.(` and replace it with `(` for function calls  
- Replace unnecessary `value ?? fallback` with just `value`

Example of auto-fix behavior:

```typescript
// Before fix
const obj: { prop: string } = { prop: 'test' };
const value = obj?.prop;
const str: string = 'hello';
const result = str ?? 'fallback';

// After running eslint --fix
const obj: { prop: string } = { prop: 'test' };
const value = obj.prop;
const str: string = 'hello';
const result = str;
```

### Current Limitations

**Mixed nullable/non-nullable chains**: When a chain expression contains both necessary and unnecessary optional chaining (e.g., `nullableObject?.nonNullProp?.nullableProp` where `nullableObject` is nullable but `nonNullProp` is not), the rule currently reports and fixes the entire chain if the first object is non-nullable. This means it may not handle all mixed cases correctly. Future versions may address this by implementing per-link checking in the chain.

**Chained nullish coalescing**: For chained nullish coalescing like `nullable1 ?? nonNullValue ?? nullable2`, the rule correctly identifies unnecessary operators but fixes the entire expression by keeping only the leftmost value. This works correctly when the leftmost value is non-nullable but may over-fix in mixed cases.

## License

ISC


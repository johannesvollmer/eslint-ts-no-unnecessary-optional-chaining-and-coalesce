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

Auto-fix is fully supported. The rule will automatically remove unnecessary optional chaining and nullish coalescing operations. For nested chains where multiple operators are unnecessary, the fixer will apply corrections iteratively across multiple passes until all unnecessary operators are removed.

### Example Auto-Fix Behavior

```typescript
// Before
const obj: { nested: { value: string } } = getData();
const result = obj?.nested?.value;

// After first pass
const result = obj.nested?.value;

// After second pass (fully fixed)
const result = obj.nested.value;
```

## License

ISC


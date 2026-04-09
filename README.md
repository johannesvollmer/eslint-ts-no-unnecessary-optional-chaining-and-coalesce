# eslint-ts-no-unnecessary-fallbacks

ESLint rule that flags `.?` and `??` usages where values will never be nullish according to TypeScript type inference.

> [!CAUTION]
> The NPM package has been renamed to `eslint-ts-no-unnecessary-fallbacks` for a shorter name! 
> This is the old package and it will not be maintained any longer.


## Installation

Via [npm package](https://www.npmjs.com/package/eslint-ts-no-unnecessary-fallbacks).
```bash
npm install --save-dev eslint-ts-no-unnecessary-fallbacks
```

## Requirements

- ESLint 9.x or 10.x
- TypeScript 5.x
- @typescript-eslint/parser 8.x
- Node.js 20.19.0 or higher
- npm 10.0.0 or higher

## Usage

Add the plugin to your ESLint configuration file (e.g., `eslint.config.js` for flat config):

```javascript
import eslintParser from '@typescript-eslint/parser';
import plugin from 'eslint-ts-no-unnecessary-fallbacks';

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
      'ts-no-unnecessary/no-unnecessary-fallbacks': 'error',
    },
  },
];
```

**Note:** ESLint 10 and later only support flat config format (`eslint.config.js`). Legacy `.eslintrc` configuration is no longer supported.

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

### Unnecessary `?? undefined`

```typescript
// ❌ Bad - value can only be undefined (not null), coalescing with undefined is redundant
const value: string | undefined = getValue();
const result = value ?? undefined;

// ✅ Good
const result = value;

// ❌ Bad - optional property can only be undefined
interface Config {
  setting?: string;
}
const config: Config = {};
const result = config.setting ?? undefined;

// ✅ Good
const result = config.setting;

// ✅ Good - value can be both null and undefined, coalescing converts null to undefined
const value: string | null | undefined = getValue();
const result = value ?? undefined;

// ✅ Good - value can only be null, coalescing converts null to undefined
const value: string | null = getValue();
const result = value ?? undefined;
```

### Unnecessary `?? null`

```typescript
// ❌ Bad - value can only be null (not undefined), coalescing with null is redundant
const value: string | null = getValue();
const result = value ?? null;

// ✅ Good
const result = value;

// ❌ Bad - function returns only null
function getNullable(): string | null {
  return null;
}
const result = getNullable() ?? null;

// ✅ Good
const result = getNullable();

// ✅ Good - value can be both null and undefined, coalescing converts undefined to null
const value: string | null | undefined = getValue();
const result = value ?? null;

// ✅ Good - value can only be undefined, coalescing converts undefined to null
const value: string | undefined = getValue();
const result = value ?? null;
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


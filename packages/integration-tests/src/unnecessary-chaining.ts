// This file intentionally contains code with unnecessary optional chaining and nullish coalescing
// that should be detected by the ESLint rule

// Unnecessary optional chaining on non-nullable object
const obj: { prop: string } = { prop: 'test' };
const value1 = obj?.prop;

// Unnecessary nullish coalescing on non-nullable string
const str: string = 'hello';
const result1 = str ?? 'fallback';

// Unnecessary optional chaining on function return
function getObj(): { prop: string } {
  return { prop: 'test' };
}
const value2 = getObj()?.prop;

// Nested unnecessary optional chaining
const obj2: { nested: { value: string } } = { nested: { value: 'test' } };
const result2 = obj2?.nested?.value;

// Unnecessary optional call
const fn: () => number = () => 42;
const result3 = fn?.();

// Multiple unnecessary nullish coalescing
const num: number = 10;
const result4 = num ?? 0;

// Literal with unnecessary nullish coalescing
const result5 = 'literal' ?? 'fallback';

// Object property access with unnecessary chaining
const config: { settings: { value: number } } = { settings: { value: 100 } };
const val = config?.settings?.value;

export {};

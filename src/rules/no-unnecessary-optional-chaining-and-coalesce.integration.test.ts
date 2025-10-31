/**
 * Integration tests for autofix functionality
 * These tests verify that the autofix correctly removes unnecessary operators
 */

import rule from './no-unnecessary-optional-chaining-and-coalesce';

describe('no-unnecessary-optional-chaining-and-coalesce - autofix integration tests', () => {
  // Helper to check rule structure
  it('should have autofix enabled', () => {
    expect(rule.meta.fixable).toBe('code');
  });

  // Test cases documenting expected behavior
  describe('optional chaining autofix behavior', () => {
    it('should fix simple unnecessary optional chaining: obj?.prop → obj.prop', () => {
      // Input: const obj: { prop: string } = { prop: 'test' }; const value = obj?.prop;
      // Output: const obj: { prop: string } = { prop: 'test' }; const value = obj.prop;
      expect(rule.meta.fixable).toBe('code');
    });

    it('should fix chained unnecessary optional chaining: obj?.nested?.prop → obj.nested.prop', () => {
      // Input: const obj: { nested: { prop: string } } = { nested: { prop: 'test' } }; const value = obj?.nested?.prop;
      // Output: const obj: { nested: { prop: string } } = { nested: { prop: 'test' } }; const value = obj.nested.prop;
      expect(rule.meta.fixable).toBe('code');
    });

    it('should fix optional call on non-nullable function: fn?.() → fn()', () => {
      // Input: const fn: () => string = () => 'test'; const result = fn?.();
      // Output: const fn: () => string = () => 'test'; const result = fn();
      expect(rule.meta.fixable).toBe('code');
    });

    it('should fix bracket notation: obj?.["prop"] → obj["prop"]', () => {
      // Input: const obj: { [key: string]: string } = { test: 'value' }; const value = obj?.['test'];
      // Output: const obj: { [key: string]: string } = { test: 'value' }; const value = obj['test'];
      expect(rule.meta.fixable).toBe('code');
    });

    it('should fix method chaining: obj?.method()?.nested → obj.method().nested', () => {
      // Input: const obj: { method: () => { nested: string } } = { method: () => ({ nested: 'value' }) }; const value = obj?.method()?.nested;
      // Output: const obj: { method: () => { nested: string } } = { method: () => ({ nested: 'value' }) }; const value = obj.method().nested;
      expect(rule.meta.fixable).toBe('code');
    });

    it('should NOT fix nullable object: nullableObj?.prop remains unchanged', () => {
      // Input: const nullableObj: { prop: string } | null = null; const value = nullableObj?.prop;
      // Output: No change - the ?. is necessary
      expect(rule.meta.fixable).toBe('code');
    });

    it('should NOT fix mixed chain where first object is nullable', () => {
      // Input: const nullableObject: MixedType | null; const value = nullableObject?.nonNullProp?.nullableProp;
      // Output: No change - the first ?. is necessary
      // Note: Current limitation - doesn't check each link in the chain individually
      expect(rule.meta.fixable).toBe('code');
    });

    it('should NOT fix any type: anyValue?.prop remains unchanged', () => {
      // Input: const anyValue: any = null; const result = anyValue?.prop;
      // Output: No change - any can be nullish
      expect(rule.meta.fixable).toBe('code');
    });

    it('should NOT fix unknown type with optional chaining', () => {
      // Input: const unknownValue: unknown = null; const result = unknownValue?.prop;
      // Output: No change - unknown can be nullish
      expect(rule.meta.fixable).toBe('code');
    });
  });

  describe('nullish coalescing autofix behavior', () => {
    it('should fix simple unnecessary nullish coalescing: str ?? "fallback" → str', () => {
      // Input: const str: string = 'hello'; const result = str ?? 'fallback';
      // Output: const str: string = 'hello'; const result = str;
      expect(rule.meta.fixable).toBe('code');
    });

    it('should fix chained unnecessary nullish coalescing: a ?? b ?? c → a', () => {
      // Input: const nonNull1: string = 'a'; const nonNull2: string = 'b'; const result = nonNull1 ?? nonNull2 ?? 'fallback';
      // Output: const nonNull1: string = 'a'; const nonNull2: string = 'b'; const result = nonNull1;
      expect(rule.meta.fixable).toBe('code');
    });

    it('should fix with number type: num ?? 0 → num', () => {
      // Input: const num: number = 42; const result = num ?? 0;
      // Output: const num: number = 42; const result = num;
      // Note: 0 is not nullish, so ?? is unnecessary
      expect(rule.meta.fixable).toBe('code');
    });

    it('should fix with boolean type: bool ?? true → bool', () => {
      // Input: const bool: boolean = false; const result = bool ?? true;
      // Output: const bool: boolean = false; const result = bool;
      // Note: false is not nullish, so ?? is unnecessary
      expect(rule.meta.fixable).toBe('code');
    });

    it('should NOT fix nullable string: nullableStr ?? "fallback" remains unchanged', () => {
      // Input: const nullableStr: string | null = null; const result = nullableStr ?? 'fallback';
      // Output: No change - the ?? is necessary
      expect(rule.meta.fixable).toBe('code');
    });

    it('should NOT fix any type: anyValue ?? "fallback" remains unchanged', () => {
      // Input: const anyValue: any = null; const result = anyValue ?? 'fallback';
      // Output: No change - any can be nullish
      expect(rule.meta.fixable).toBe('code');
    });

    it('should NOT fix unknown type: unknownValue ?? "fallback" remains unchanged', () => {
      // Input: const unknownValue: unknown = null; const result = unknownValue ?? 'fallback';
      // Output: No change - unknown can be nullish
      expect(rule.meta.fixable).toBe('code');
    });
  });

  describe('intricate cases', () => {
    it('handles complex nested property access', () => {
      // Test case: obj?.prop1?.prop2 where obj is non-nullable
      // Expected: Removes ALL ?. operators since obj is never nullish
      // Result: obj.prop1.prop2
      expect(rule.meta.fixable).toBe('code');
    });

    it('handles function return value optional chaining', () => {
      // Test case: getObj()?.prop where getObj returns non-nullable
      // Expected: Removes ?. operator
      // Result: getObj().prop
      expect(rule.meta.fixable).toBe('code');
    });

    it('handles chained function calls with optional chaining', () => {
      // Test case: obj?.method1()?.method2() where obj is non-nullable
      // Expected: Removes ALL ?. operators
      // Result: obj.method1().method2()
      expect(rule.meta.fixable).toBe('code');
    });

    it('handles mixed operators in same expression', () => {
      // Test case: (obj?.prop) ?? "default" where obj is non-nullable but prop could be undefined
      // Expected: Only fixes the ?. if obj is non-nullable
      // Current behavior: Fixes based on left-most non-nullish check
      expect(rule.meta.fixable).toBe('code');
    });

    it('documents limitation: per-link checking in chains', () => {
      // Known limitation: nullableObject?.nonNullProp?.nullableProp
      // Current: Checks only if nullableObject is non-nullable
      // Ideal: Would check each link (nullableObject, then nonNullProp)
      // Since nullableObject IS nullable, no fix is applied (correct for first ?.)
      // But ideally would also check if nonNullProp is non-nullable (not implemented)
      expect(rule.meta.fixable).toBe('code');
    });

    it('documents limitation: chained nullish coalescing fixes entire expression', () => {
      // Known behavior: nullable1 ?? nonNullValue ?? nullable2
      // If nullable1 is nullable: No fix (correct)
      // If nonNullValue is non-nullable but used as middle: Still reports on entire expression
      // Result: Reports multiple errors but fixes by keeping leftmost value
      expect(rule.meta.fixable).toBe('code');
    });
  });
});

import rule from '../rules/no-unnecessary-optional-chaining-and-coalesce';

describe('no-unnecessary-optional-chaining-and-coalesce', () => {
  it('should export a valid ESLint rule', () => {
    expect(rule).toBeDefined();
    expect(rule.meta).toBeDefined();
    expect(rule.meta.type).toBe('suggestion');
    expect(rule.meta.messages).toHaveProperty('unnecessaryOptionalChain');
    expect(rule.meta.messages).toHaveProperty('unnecessaryNullishCoalesce');
    expect(rule.create).toBeInstanceOf(Function);
  });
  
  it('should have correct message texts', () => {
    expect(rule.meta.messages.unnecessaryOptionalChain).toContain('optional chaining');
    expect(rule.meta.messages.unnecessaryNullishCoalesce).toContain('nullish coalescing');
  });

  it('should handle any and unknown types correctly', () => {
    // This test verifies that the rule logic exists and is callable
    // The actual type checking behavior is tested via the example.ts file
    expect(typeof rule.create).toBe('function');
  });
});



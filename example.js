"use strict";
// Example with unnecessary optional chaining
const obj = { prop: 'test' };
const value = obj?.prop; // Should be flagged
// Example with necessary optional chaining
const nullableObj = null;
const safeValue = nullableObj?.prop; // Should be OK
// Example with unnecessary nullish coalescing
const str = 'hello';
const result = str ?? 'fallback'; // Should be flagged
// Example with necessary nullish coalescing
const nullableStr = null;
const safeResult = nullableStr ?? 'fallback'; // Should be OK
// Example with any type - should NOT be flagged (any can be null/undefined)
const anyValue = null;
const anyResult = anyValue?.prop; // Should be OK
const anyCoalesce = anyValue ?? 'fallback'; // Should be OK
// Example with unknown type - should NOT be flagged (unknown can be null/undefined)
const unknownValue = null;
const unknownCoalesce = unknownValue ?? 'fallback'; // Should be OK

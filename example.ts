// Example with unnecessary optional chaining
const obj: { prop: string } = { prop: 'test' };
const value = obj?.prop; // Should be flagged

// Example with necessary optional chaining
const nullableObj: { prop: string } | null = null;
const safeValue = nullableObj?.prop; // Should be OK

// Example with unnecessary nullish coalescing
const str: string = 'hello';
const result = str ?? 'fallback'; // Should be flagged

// Example with necessary nullish coalescing
const nullableStr: string | null = null;
const safeResult = nullableStr ?? 'fallback'; // Should be OK

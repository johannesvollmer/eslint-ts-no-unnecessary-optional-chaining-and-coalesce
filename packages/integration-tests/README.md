# Integration Tests

This package contains integration tests for the `eslint-ts-no-unnecessary-optional-chaining-and-coalesce` ESLint plugin.

## Purpose

The integration tests verify that:
1. The ESLint plugin correctly integrates with ESLint
2. The rule detects all unnecessary optional chaining and nullish coalescing operators
3. The plugin can be loaded and configured properly

## Structure

- **`src/unnecessary-chaining.ts`**: Contains TypeScript code with intentional unnecessary optional chaining and nullish coalescing operators that should be detected by the rule
- **`src/integration.test.ts`**: Jest tests that run ESLint on the test file and verify the expected errors are reported
- **`eslint.config.js`**: ESLint configuration that uses the plugin

## Running Tests

```bash
npm test
```

## Running ESLint

You can also run ESLint directly to see the detected errors:

```bash
npm run lint
```

This will output JSON showing all the detected unnecessary operators.

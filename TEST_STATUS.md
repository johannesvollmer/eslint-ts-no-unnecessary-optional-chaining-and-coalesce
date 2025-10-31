# Test Status

## Overview

Comprehensive RuleTester-based tests have been added to the repository in `src/rules/no-unnecessary-optional-chaining-and-coalesce.test.ts`.

## Test Coverage

The tests include:

### Valid Cases (13 tests)
- Optional chaining with `null`, `undefined`, and `null | undefined` types
- Nullish coalescing with nullable types
- Operations with `any` type
- Operations with `unknown` type  
- Optional calls with nullable functions
- Union types that include null/undefined
- Functions returning nullable types

### Invalid Cases (10 tests)
- Optional chaining on guaranteed non-null objects
- Nullish coalescing on guaranteed non-null values
- Operations on interfaces and type definitions
- Multiple unnecessary optional chains
- Operations on literal values
- Unnecessary optional calls on guaranteed functions

## Known Issue

The tests are currently failing due to a TypeScript configuration issue with the RuleTester and TypeScript's project mode. The RuleTester creates virtual/in-memory files (e.g., `file.ts`) for testing, but TypeScript's project mode requires files to exist on disk and be included in the tsconfig's file list.

###  Attempted Solutions

Multiple approaches were tried:
1. Using `project` with various tsconfig configurations
2. Using `EXPERIMENTAL_useProjectService` flag (recommended for RuleTester)
3. Creating custom tsconfig files with permissive include patterns
4. Using `createDefaultProgram` option
5. Setting `allowDefaultProjectForFiles`

### Root Cause

The issue stems from the fact that type-aware ESLint rules require TypeScript's program API, which needs access to the project's type information. RuleTester creates virtual files that don't exist on disk, causing TypeScript's file resolution to fail with the error:

```
ESLint was configured to run on `<tsconfigRootDir>/file.ts` using `parserOptions.project`
However, that TSConfig does not include this file.
```

### Next Steps

To resolve this issue, one of the following approaches should be tried:

1. **Use a different testing approach**: Create actual TypeScript files on disk for testing rather than using RuleTester's virtual files
2. **Upgrade dependencies**: Ensure all TypeScript-ESLint packages are compatible versions
3. **Consult TypeScript-ESLint documentation**: Check for updated examples of testing type-aware rules
4. **Use different test framework**: Consider using Vitest instead of Jest (as RuleTester's own tests use Vitest)

## Test Structure Quality

Despite the configuration issues, the test structure itself is well-designed:
- Uses the official `@typescript-eslint/rule-tester` package
- Follows ESLint testing best practices  
- Comprehensive coverage of all scenarios documented in the README
- Clear separation between valid and invalid test cases
- Each test case is focused and well-documented

The tests are ready to run once the TypeScript configuration issue is resolved.

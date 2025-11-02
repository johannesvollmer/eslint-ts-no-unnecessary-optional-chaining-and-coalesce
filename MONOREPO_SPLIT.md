# Monorepo Split Summary

This repository has been reorganized into a monorepo structure with two packages to better demonstrate and test the ESLint rule's integration with ESLint.

## Structure

### Root Package (`package.json`)
- Private monorepo root package
- Uses npm workspaces to manage the two sub-packages
- Provides unified build, test, and lint scripts that run across all packages

### Package 1: `packages/eslint-plugin`
The main ESLint plugin package that can be published to npm.

**Contents:**
- Original source code for the ESLint rule
- All original unit tests
- TypeScript configuration
- Build and test scripts
- README and LICENSE files for publishing

**Purpose:** This is the package users will install when they want to use the ESLint rule in their projects.

### Package 2: `packages/integration-tests`
A test package that depends on the main plugin package and verifies full integration.

**Contents:**
- `src/unnecessary-chaining.ts`: TypeScript file with intentional unnecessary optional chaining and nullish coalescing operators
- `src/integration.test.ts`: Jest tests that run ESLint with the plugin and verify it correctly detects all issues
- `eslint.config.js`: ESLint configuration that imports and uses the plugin
- TypeScript and Jest configurations

**Purpose:** This package demonstrates the plugin working in a real ESLint setup and ensures the plugin correctly integrates with ESLint's ecosystem.

## Key Benefits

1. **Separation of Concerns**: The plugin code is separate from integration testing
2. **Real-World Testing**: Integration tests verify the plugin works in an actual ESLint setup, not just in isolated unit tests
3. **Example Usage**: The integration-tests package serves as a concrete example of how to configure and use the plugin
4. **Maintainability**: Each package has its own dependencies and can be developed/tested independently
5. **Publishing Ready**: The eslint-plugin package is ready to be published to npm with only the necessary files

## Testing

The repository now has two levels of testing:

1. **Unit Tests** (in `packages/eslint-plugin`): Test the rule logic in isolation using @typescript-eslint/rule-tester
2. **Integration Tests** (in `packages/integration-tests`): Test the full ESLint integration by running ESLint on actual TypeScript files and verifying the output

Both test suites run successfully:
- eslint-plugin: 31 unit tests pass
- integration-tests: 2 integration tests pass, detecting 8 errors (5 optional chaining, 3 nullish coalescing)

## Building and Testing

```bash
# Build all packages
npm run build

# Test all packages
npm test

# Work with individual packages
cd packages/eslint-plugin && npm test
cd packages/integration-tests && npm test
```

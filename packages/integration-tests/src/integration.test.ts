import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';
import path from 'path';

describe('ESLint Integration Tests', () => {
  it('should detect all unnecessary optional chaining and nullish coalescing', () => {
    const filePath = path.join(__dirname, '../src/unnecessary-chaining.ts');
    
    let eslintOutput: any;
    try {
      // Run ESLint on the test file
      const output = execSync(
        `npx eslint "${filePath}" --format json`,
        { 
          cwd: path.join(__dirname, '..'),
          encoding: 'utf-8',
          // Don't throw on non-zero exit (ESLint returns 1 when there are errors)
          stdio: ['pipe', 'pipe', 'pipe']
        }
      );
      eslintOutput = JSON.parse(output);
    } catch (error: any) {
      // ESLint returns exit code 1 when there are errors, which is expected
      if (error.stdout) {
        eslintOutput = JSON.parse(error.stdout);
      } else {
        throw error;
      }
    }

    // Verify that we got results for our test file
    expect(eslintOutput).toBeDefined();
    expect(Array.isArray(eslintOutput)).toBe(true);
    expect(eslintOutput.length).toBeGreaterThan(0);

    const fileResults = eslintOutput[0];
    expect(fileResults.filePath).toContain('unnecessary-chaining.ts');

    // Verify we got multiple errors (we have many unnecessary chainings in the test file)
    expect(fileResults.messages).toBeDefined();
    expect(fileResults.messages.length).toBeGreaterThan(0);

    // Verify all messages are from our rule
    fileResults.messages.forEach((message: any) => {
      expect(message.ruleId).toBe('ts-no-unnecessary/no-unnecessary-optional-chaining-and-coalesce');
      expect(['unnecessaryOptionalChain', 'unnecessaryNullishCoalesce']).toContain(message.messageId);
    });

    // Verify we have a good mix of both types of errors
    const optionalChainErrors = fileResults.messages.filter(
      (m: any) => m.messageId === 'unnecessaryOptionalChain'
    );
    const nullishCoalesceErrors = fileResults.messages.filter(
      (m: any) => m.messageId === 'unnecessaryNullishCoalesce'
    );

    expect(optionalChainErrors.length).toBeGreaterThan(0);
    expect(nullishCoalesceErrors.length).toBeGreaterThan(0);

    // Log the results for debugging
    console.log(`Found ${fileResults.messages.length} total errors:`);
    console.log(`  - ${optionalChainErrors.length} unnecessary optional chaining`);
    console.log(`  - ${nullishCoalesceErrors.length} unnecessary nullish coalescing`);
  });

  it('should successfully load the ESLint plugin', () => {
    // Verify that the plugin can be loaded without errors
    const output = execSync(
      'npx eslint --print-config src/unnecessary-chaining.ts',
      { 
        cwd: path.join(__dirname, '..'),
        encoding: 'utf-8'
      }
    );

    const config = JSON.parse(output);
    
    // Verify our rule is configured
    expect(config.rules).toBeDefined();
    // ESLint can represent 'error' as 'error' or [2] (they're equivalent)
    const ruleConfig = config.rules['ts-no-unnecessary/no-unnecessary-optional-chaining-and-coalesce'];
    expect(ruleConfig === 'error' || (Array.isArray(ruleConfig) && ruleConfig[0] === 2)).toBe(true);
  });
});

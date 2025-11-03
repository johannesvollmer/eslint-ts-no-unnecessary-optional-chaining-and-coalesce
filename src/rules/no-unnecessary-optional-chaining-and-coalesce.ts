import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import * as ts from 'typescript';

type MessageIds = 'unnecessaryOptionalChain' | 'unnecessaryNullishCoalesce' | 'requiresStrictNullChecks';

type MessageData = {
  type: string;
};

export const noUnnecessaryOptionalChainingAndCoalesce = ESLintUtils.RuleCreator(
  (name) => `https://github.com/johannesvollmer/eslint-ts-no-unnecessary-optional-chaining-and-coalesce#${name}`
)<[], MessageIds>({
  name: 'no-unnecessary-optional-chaining-and-coalesce',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow unnecessary optional chaining and nullish coalescing when TypeScript knows the value is never nullish',
    },
    messages: {
      unnecessaryOptionalChain: 'Unnecessary `?.`: This value of type `{{type}}` will never be nullish.',
      unnecessaryNullishCoalesce: 'Unnecessary `??`: This value of type `{{type}}` will never be nullish.',
      requiresStrictNullChecks: 'Checking for unnecessary `.?` and `??` requires `strictNullChecks` to be enabled in tsconfig, and requires full type information (using the typescript parser for eslint).',
    },
    schema: [],
    fixable: 'code',
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context, true);
    if (!services.program){
      context.report({
        loc: { line: 1, column: 0 },
        messageId: 'requiresStrictNullChecks',
      });
      return {};
    }
        
    const compilerOptions = services.program.getCompilerOptions();
    const hasStrictNullChecks = (compilerOptions.strictNullChecks ?? false) || (compilerOptions.strict ?? false);
    if (!hasStrictNullChecks){
      context.report({
        loc: { line: 1, column: 0 },
        messageId: 'requiresStrictNullChecks',
      });
      return {};
    }

    const checker = services.program.getTypeChecker();

    function isNullish(type: ts.Type): boolean {
      // any and unknown types can contain null/undefined, so treat them as potentially nullish
      if (type.flags & ts.TypeFlags.Any || type.flags & ts.TypeFlags.Unknown) {
        return true;
      }

      // Check if type includes null or undefined
      if (type.flags & ts.TypeFlags.Null || type.flags & ts.TypeFlags.Undefined) {
        return true;
      }

      // Check union types
      if (type.isUnion()) {
        return type.types.some(t => isNullish(t));
      }

      return false;
    }

    function getTypeString(type: ts.Type): string {
      return checker.typeToString(type);
    }

    function checkIfNeverNullish(node: TSESTree.Node): { isNeverNullish: boolean; typeString: string } {
      // Unwrap ChainExpression to get the actual expression
      let actualNode = node;
      if (node.type === 'ChainExpression') {
        actualNode = node.expression;
      }
      
      const tsNode = services.esTreeNodeToTSNodeMap.get(actualNode);
      const type = checker.getTypeAtLocation(tsNode);
      
      return {
        isNeverNullish: !isNullish(type),
        typeString: getTypeString(type)
      };
    }

    /**
     * Recursively finds the innermost unnecessary optional chaining in a MemberExpression chain.
     * Returns the innermost MemberExpression with unnecessary optional chaining and its type.
     * "Innermost" means the deepest in the execution order (rightmost in the chain).
     * When multiple levels are unnecessary, returns the innermost (rightmost) one first.
     */
    function findInnermostUnnecessaryOptionalChain(
      memberExpr: TSESTree.MemberExpression
    ): { node: TSESTree.MemberExpression; typeString: string } | undefined {
      // Base case: if not optional, nothing to check
      if (!memberExpr.optional) {
        return undefined;
      }

      const objectToCheck = memberExpr.object;
      
      // If the object is a MemberExpression with optional, recurse to check deeper chains first
      if (objectToCheck.type === 'MemberExpression' && objectToCheck.optional) {
        // First check if there's an unnecessary chain deeper in
        const innerResult = findInnermostUnnecessaryOptionalChain(objectToCheck);
        if (innerResult) {
          // Found an inner unnecessary chain, return it (innermost first)
          return innerResult;
        }
        // No inner unnecessary chain found in the deeper levels
        // Don't check the current level when object is optional - it will be checked in its own iteration
        return undefined;
      } else if (objectToCheck.type === 'ChainExpression') {
        // Skip ChainExpressions as they will be handled by their own visitor
        return undefined;
      } else if (objectToCheck.type === 'CallExpression' && objectToCheck.optional) {
        // If the object is an optional call (e.g., fn?.() in fn?.().prop),
        // don't return undefined - let the caller handle it
        // The call will be checked separately in the ChainExpression visitor
        return undefined;
      } else {
        // Object is not an optional chain, check if it's non-nullish
        const check = checkIfNeverNullish(objectToCheck);
        if (check.isNeverNullish) {
          return {
            node: memberExpr,
            typeString: check.typeString
          };
        }
      }
      
      return undefined;
    }

    return {
      // Handle optional chaining: value?.property or call()?.property
      ChainExpression(node: TSESTree.ChainExpression) {
        const sourceCode = context.sourceCode;
        
        if (node.expression.type === 'MemberExpression' && node.expression.optional) {
          // Find the innermost unnecessary optional chain
          const result = findInnermostUnnecessaryOptionalChain(node.expression as TSESTree.MemberExpression);
          
          // Report the innermost unnecessary optional chain
          if (result) {
            context.report({
              node: result.node,
              messageId: 'unnecessaryOptionalChain',
              data: {
                type: result.typeString
              } satisfies MessageData,
              fix(fixer) {
                const sourceCode = context.sourceCode;
                
                // Get the text of the member expression to fix
                const memberText = sourceCode.getText(result.node);
                
                // For computed properties (arr?.[0]), replace ?.[ with [
                // For regular properties (obj?.prop), replace ?. with .
                let fixedText: string;
                if (result.node.computed) {
                  // Computed property: arr?.[0] -> arr[0]
                  fixedText = memberText.replace('?.[', '[');
                } else {
                  // Regular property: obj?.prop -> obj.prop
                  fixedText = memberText.replace('?.', '.');
                }
                
                return fixer.replaceText(result.node, fixedText);
              },
            });
            return; // Found and reported an error, don't check further
          }
          
          // No unnecessary member chaining found, but check if the object is an optional call
          const object = node.expression.object;
          if (object.type === 'CallExpression' && object.optional) {
            const calleeCheck = checkIfNeverNullish(object.callee);
            if (calleeCheck.isNeverNullish) {
              // The optional call is unnecessary
              context.report({
                node: object,
                messageId: 'unnecessaryOptionalChain',
                data: {
                  type: calleeCheck.typeString
                } satisfies MessageData,
                fix(fixer) {
                  const calleeText = sourceCode.getText(object.callee);
                  const argsText = object.arguments.map((arg: TSESTree.Node) => sourceCode.getText(arg)).join(', ');
                  const fixedText = `${calleeText}(${argsText})`;
                  return fixer.replaceText(object, fixedText);
                },
              });
            }
          }
        } else if (node.expression.type === 'CallExpression' && node.expression.optional) {
          // Handle optional call expression
          const calleeNode = node.expression.callee;
          
          // If the callee is a MemberExpression with optional, check its chain first
          // For example, in x.selectedCategoryName?.toLowerCase?.(), the callee is
          // x.selectedCategoryName?.toLowerCase (a MemberExpression with optional)
          // We should check x.selectedCategoryName, not the whole callee
          if (calleeNode.type === 'MemberExpression' && calleeNode.optional) {
            const result = findInnermostUnnecessaryOptionalChain(calleeNode);
            
            if (result) {
              // Report error on the innermost unnecessary member access in the callee
              context.report({
                node: result.node,
                messageId: 'unnecessaryOptionalChain',
                data: {
                  type: result.typeString
                } satisfies MessageData,
                fix(fixer) {
                  const memberText = sourceCode.getText(result.node);
                  
                  let fixedText: string;
                  if (result.node.computed) {
                    fixedText = memberText.replace('?.[', '[');
                  } else {
                    fixedText = memberText.replace('?.', '.');
                  }
                  
                  return fixer.replaceText(result.node, fixedText);
                },
              });
              return; // Don't check the call itself
            }
          }
          
          // Check the callee of the optional call
          const check = checkIfNeverNullish(calleeNode);
          
          if (check.isNeverNullish) {
            context.report({
              node: node,
              messageId: 'unnecessaryOptionalChain',
              data: {
                type: check.typeString
              } satisfies MessageData,
              fix(fixer) {
                const sourceCode = context.sourceCode;
                const callExpr = node.expression as TSESTree.CallExpression;
                
                // Get the text of the callee and arguments
                const calleeText = sourceCode.getText(callExpr.callee);
                const argsText = callExpr.arguments.map(arg => sourceCode.getText(arg)).join(', ');
                
                // Build the fixed text: fn?.() -> fn()
                const fixedText = `${calleeText}(${argsText})`;
                
                return fixer.replaceText(node, fixedText);
              },
            });
          }
        }
      },

      // Handle nullish coalescing: value ?? fallback or call() ?? fallback
      LogicalExpression(node: TSESTree.LogicalExpression) {
        if (node.operator === '??') {
          const left = node.left;
          
          const check = checkIfNeverNullish(left);
          if (check.isNeverNullish) {
            context.report({
              node: node,
              messageId: 'unnecessaryNullishCoalesce',
              data: {
                type: check.typeString
              } satisfies MessageData,
              fix(fixer) {
                const sourceCode = context.sourceCode;
                const leftText = sourceCode.getText(left);
                
                return fixer.replaceText(node, leftText);
              },
            });
          }
        }
      },
    };
  },
});

export default noUnnecessaryOptionalChainingAndCoalesce;

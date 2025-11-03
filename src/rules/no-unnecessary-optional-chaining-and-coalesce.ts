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

    return {
      // Handle optional chaining: value?.property or call()?.property
      ChainExpression(node: TSESTree.ChainExpression) {
        const sourceCode = context.sourceCode;
        const nodeText = sourceCode.getText(node);
        if (node.expression.type === 'MemberExpression') {
        } else if (node.expression.type === 'CallExpression') {
        }
        
        if (node.expression.type === 'MemberExpression' && node.expression.optional) {
          
          // Walk through the chain of MemberExpressions to find the innermost unnecessary optional chaining
          // Start from the outermost and work inward
          let current: TSESTree.MemberExpression | undefined = node.expression as TSESTree.MemberExpression;
          let innermostUnnecessary: TSESTree.MemberExpression | undefined;
          let innermostUnnecessaryTypeString: string | undefined;
          
          while (current) {
            
            if (current.optional) {
              const objectToCheck = current.object;
              
              // Skip if the object is itself an optional chain (we'll check it in the next iteration)
              if (objectToCheck.type !== 'MemberExpression' || !objectToCheck.optional) {
                if (objectToCheck.type !== 'ChainExpression') {
                  const check = checkIfNeverNullish(objectToCheck);
                  
                  if (check.isNeverNullish) {
                    // This is an unnecessary optional chain
                    // Keep track of it, and continue checking inner chains
                    innermostUnnecessary = current;
                    innermostUnnecessaryTypeString = check.typeString;
                  }
                }
              }
            }
            
            // Move to the next inner MemberExpression
            if (current.object.type === 'MemberExpression') {
              current = current.object;
            } else {
              break;
            }
          }
          
          // Report the innermost unnecessary optional chain
          if (innermostUnnecessary && innermostUnnecessaryTypeString) {
            
            context.report({
              node: innermostUnnecessary,
              messageId: 'unnecessaryOptionalChain',
              data: {
                type: innermostUnnecessaryTypeString
              } satisfies MessageData,
              fix(fixer) {
                const sourceCode = context.sourceCode;
                
                // Get the text of the member expression to fix
                const memberText = sourceCode.getText(innermostUnnecessary!);
                
                // For computed properties (arr?.[0]), replace ?.[ with [
                // For regular properties (obj?.prop), replace ?. with .
                let fixedText: string;
                if (innermostUnnecessary!.computed) {
                  // Computed property: arr?.[0] -> arr[0]
                  fixedText = memberText.replace('?.[', '[');
                } else {
                  // Regular property: obj?.prop -> obj.prop
                  fixedText = memberText.replace('?.', '.');
                }
                
                return fixer.replaceText(innermostUnnecessary!, fixedText);
              },
            });
          }
        } else if (node.expression.type === 'CallExpression' && node.expression.optional) {
          // Handle optional call expression
          const calleeNode = node.expression.callee;
          
          // If the callee is a MemberExpression with optional, check its object first
          // For example, in x.selectedCategoryName?.toLowerCase?.(), the callee is
          // x.selectedCategoryName?.toLowerCase (a MemberExpression with optional)
          // We should check x.selectedCategoryName, not the whole callee
          if (calleeNode.type === 'MemberExpression' && calleeNode.optional) {
            // Walk through the chain to find the innermost unnecessary optional
            let current: TSESTree.MemberExpression | undefined = calleeNode;
            let innermostUnnecessary: TSESTree.MemberExpression | undefined;
            let innermostUnnecessaryTypeString: string | undefined;
            
            while (current) {
              
              if (current.optional) {
                const objectToCheck = current.object;
                
                if (objectToCheck.type !== 'MemberExpression' || !objectToCheck.optional) {
                  if (objectToCheck.type !== 'ChainExpression') {
                    const check = checkIfNeverNullish(objectToCheck);
                    
                    if (check.isNeverNullish) {
                      innermostUnnecessary = current;
                      innermostUnnecessaryTypeString = check.typeString;
                    }
                  }
                }
              }
              
              if (current.object.type === 'MemberExpression') {
                current = current.object;
              } else {
                break;
              }
            }
            
            if (innermostUnnecessary && innermostUnnecessaryTypeString) {
              // Report error on the innermost unnecessary member access in the callee
              context.report({
                node: innermostUnnecessary,
                messageId: 'unnecessaryOptionalChain',
                data: {
                  type: innermostUnnecessaryTypeString
                } satisfies MessageData,
                fix(fixer) {
                  const memberText = sourceCode.getText(innermostUnnecessary!);
                  
                  let fixedText: string;
                  if (innermostUnnecessary!.computed) {
                    fixedText = memberText.replace('?.[', '[');
                  } else {
                    fixedText = memberText.replace('?.', '.');
                  }
                  
                  return fixer.replaceText(innermostUnnecessary!, fixedText);
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

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
      // ChainExpression nodes wrap the actual expression we need to type-check
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
     * "Innermost" means the deepest in the execution order (rightmost in the chain).
     * When multiple levels are unnecessary, returns the innermost (rightmost) one first.
     */
    function findInnermostUnnecessaryOptionalChain(
      memberExpr: TSESTree.MemberExpression
    ): { node: TSESTree.MemberExpression; typeString: string } | undefined {
      if (!memberExpr.optional) {
        return undefined;
      }

      const objectToCheck = memberExpr.object;
      
      if (objectToCheck.type === 'MemberExpression' && objectToCheck.optional) {
        const innerResult = findInnermostUnnecessaryOptionalChain(objectToCheck);
        if (innerResult) {
          return innerResult;
        }
        // Don't check current level when object is optional - it will be checked in its own iteration
        return undefined;
      } else if (objectToCheck.type === 'ChainExpression') {
        // ChainExpressions are handled by their own visitor
        return undefined;
      } else if (objectToCheck.type === 'CallExpression' && objectToCheck.optional) {
        // Optional calls are checked separately in the ChainExpression visitor
        return undefined;
      } else {
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
      ChainExpression(node: TSESTree.ChainExpression) {
        const sourceCode = context.sourceCode;
        
        if (node.expression.type === 'MemberExpression' && node.expression.optional) {
          const result = findInnermostUnnecessaryOptionalChain(node.expression as TSESTree.MemberExpression);
          
          if (result) {
            context.report({
              node: result.node,
              messageId: 'unnecessaryOptionalChain',
              data: {
                type: result.typeString
              } satisfies MessageData,
              fix(fixer) {
                const sourceCode = context.sourceCode;
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
            return;
          }
          
          // Check if the object is an optional call that needs fixing
          const object = node.expression.object;
          if (object.type === 'CallExpression' && object.optional) {
            const calleeCheck = checkIfNeverNullish(object.callee);
            if (calleeCheck.isNeverNullish) {
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
          const calleeNode = node.expression.callee;
          
          // For chained optional calls like x?.method?.(), check the member chain first
          if (calleeNode.type === 'MemberExpression' && calleeNode.optional) {
            const result = findInnermostUnnecessaryOptionalChain(calleeNode);
            
            if (result) {
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
              return;
            }
          }
          
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
                const calleeText = sourceCode.getText(callExpr.callee);
                const argsText = callExpr.arguments.map(arg => sourceCode.getText(arg)).join(', ');
                const fixedText = `${calleeText}(${argsText})`;
                
                return fixer.replaceText(node, fixedText);
              },
            });
          }
        }
      },

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

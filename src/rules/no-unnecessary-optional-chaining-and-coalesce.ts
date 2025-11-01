import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import * as ts from 'typescript';

type MessageIds = 'unnecessaryOptionalChain' | 'unnecessaryNullishCoalesce';

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
      unnecessaryOptionalChain: 'Unnecessary optional chaining - the value is of type `{{type}}` which is never nullish.',
      unnecessaryNullishCoalesce: 'Unnecessary nullish coalescing - the value is of type `{{type}}` which is never nullish.',
    },
    schema: [],
    fixable: 'code',
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
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
        if (node.expression.type === 'MemberExpression' && node.expression.optional) {
          // Check the object being accessed
          const object = node.expression.object;
          
          const check = checkIfNeverNullish(object);
          if (check.isNeverNullish) {
            context.report({
              node: node,
              messageId: 'unnecessaryOptionalChain',
              data: {
                type: check.typeString
              },
              fix(fixer) {
                const sourceCode = context.sourceCode;
                const memberExpr = node.expression as TSESTree.MemberExpression;
                
                // Get the full text of the chain expression
                const chainText = sourceCode.getText(node);
                
                // For computed properties (arr?.[0]), replace ?.[ with [
                // For regular properties (obj?.prop), replace ?. with .
                let fixedText: string;
                if (memberExpr.computed) {
                  // Computed property: arr?.[0] -> arr[0]
                  fixedText = chainText.replace('?.[', '[');
                } else {
                  // Regular property: obj?.prop -> obj.prop
                  fixedText = chainText.replace('?.', '.');
                }
                
                return fixer.replaceText(node, fixedText);
              },
            });
          }
        } else if (node.expression.type === 'CallExpression' && node.expression.optional) {
          // Handle optional call expression
          const callee = node.expression.callee;
          
          const check = checkIfNeverNullish(callee);
          if (check.isNeverNullish) {
            context.report({
              node: node,
              messageId: 'unnecessaryOptionalChain',
              data: {
                type: check.typeString
              },
              fix(fixer) {
                const sourceCode = context.sourceCode;
                
                // Get the full text of the chain expression
                const chainText = sourceCode.getText(node);
                
                // Replace the first occurrence of ?. with empty string (for calls like fn?.())
                // This handles fn?.() -> fn()
                const fixedText = chainText.replace('?.', '');
                
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
              },
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

import { ESLintUtils, TSESLint, TSESTree } from '@typescript-eslint/utils';
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

    /**
     * Check if a TypeScript type can be nullish (null or undefined)
     */
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

    /**
     * Unified method to check if a node requires nullish handling.
     * Returns type information if the node is never nullish, otherwise returns undefined.
     */
    function checkUnnecessaryNullishHandling(node: TSESTree.Node): { typeString: string } | undefined {
      // ChainExpression nodes wrap the actual expression we need to type-check
      let actualNode = node;
      if (node.type === 'ChainExpression') {
        actualNode = node.expression;
      }
      
      const tsNode = services.esTreeNodeToTSNodeMap.get(actualNode);
      const type = checker.getTypeAtLocation(tsNode);
      
      if (!isNullish(type)) {
        return { typeString: checker.typeToString(type) };
      }
      
      return undefined;
    }

    /**
     * Recursively finds the innermost unnecessary optional chaining in a chain.
     * Returns the innermost (rightmost) unnecessary optional access first.
     */
    function findInnermostUnnecessaryOptionalChain(
      memberExpr: TSESTree.MemberExpression
    ): { node: TSESTree.MemberExpression; typeString: string } | undefined {
      if (!memberExpr.optional) {
        return undefined;
      }

      const objectToCheck = memberExpr.object;
      
      // Recursively check nested optional member expressions
      if (objectToCheck.type === 'MemberExpression' && objectToCheck.optional) {
        const innerResult = findInnermostUnnecessaryOptionalChain(objectToCheck);
        if (innerResult) {
          return innerResult;
        }
        // Don't check current level when object is optional - it will be checked in its own iteration
        return undefined;
      }
      
      // Skip ChainExpressions and optional calls - they're handled by their own visitors
      if (objectToCheck.type === 'ChainExpression' || 
          (objectToCheck.type === 'CallExpression' && objectToCheck.optional)) {
        return undefined;
      }
      
      // Check if the object requires nullish handling
      const check = checkUnnecessaryNullishHandling(objectToCheck);
      if (check) {
        return {
          node: memberExpr,
          typeString: check.typeString
        };
      }
      
      return undefined;
    }

    /**
     * Unified fix generator for optional chaining
     */
    function createOptionalChainFix(node: TSESTree.Node, sourceCode: Readonly<TSESLint.SourceCode>) {
      return (fixer: TSESLint.RuleFixer) => {
        const nodeText = sourceCode.getText(node);
        let fixedText: string;
        
        if (node.type === 'MemberExpression' && node.computed) {
          fixedText = nodeText.replace('?.[', '[');
        } else if (node.type === 'MemberExpression') {
          fixedText = nodeText.replace('?.', '.');
        } else if (node.type === 'ChainExpression' && node.expression.type === 'CallExpression') {
          const callExpr = node.expression as TSESTree.CallExpression;
          const calleeText = sourceCode.getText(callExpr.callee);
          const argsText = callExpr.arguments.map((arg: TSESTree.Node) => sourceCode.getText(arg)).join(', ');
          fixedText = `${calleeText}(${argsText})`;
        } else if (node.type === 'CallExpression' && node.optional) {
          const calleeText = sourceCode.getText(node.callee);
          const argsText = node.arguments.map((arg: TSESTree.Node) => sourceCode.getText(arg)).join(', ');
          fixedText = `${calleeText}(${argsText})`;
        } else {
          return null;
        }
        
        return fixer.replaceText(node, fixedText);
      };
    }

    /**
     * Unified method to report unnecessary optional chaining
     */
    function reportUnnecessaryOptionalChain(node: TSESTree.Node, typeString: string) {
      context.report({
        node,
        messageId: 'unnecessaryOptionalChain',
        data: { type: typeString } satisfies MessageData,
        fix: createOptionalChainFix(node, context.sourceCode),
      });
    }

    return {
      ChainExpression(node: TSESTree.ChainExpression) {
        const expression = node.expression;
        
        // Handle optional member expressions (e.g., obj?.prop)
        if (expression.type === 'MemberExpression' && expression.optional) {
          const result = findInnermostUnnecessaryOptionalChain(expression);
          
          if (result) {
            reportUnnecessaryOptionalChain(result.node, result.typeString);
            return;
          }
          
          // Check if the object is an optional call that needs fixing
          const object = expression.object;
          if (object.type === 'CallExpression' && object.optional) {
            const check = checkUnnecessaryNullishHandling(object.callee);
            if (check) {
              reportUnnecessaryOptionalChain(object, check.typeString);
            }
          }
        } 
        // Handle optional call expressions (e.g., fn?.())
        else if (expression.type === 'CallExpression' && expression.optional) {
          const calleeNode = expression.callee;
          
          // For chained optional calls like x?.method?.(), check the member chain first
          if (calleeNode.type === 'MemberExpression' && calleeNode.optional) {
            const result = findInnermostUnnecessaryOptionalChain(calleeNode);
            
            if (result) {
              reportUnnecessaryOptionalChain(result.node, result.typeString);
              return;
            }
          }
          
          // Check if the callee requires nullish handling
          const check = checkUnnecessaryNullishHandling(calleeNode);
          if (check) {
            reportUnnecessaryOptionalChain(node, check.typeString);
          }
        }
      },

      LogicalExpression(node: TSESTree.LogicalExpression) {
        if (node.operator === '??') {
          const check = checkUnnecessaryNullishHandling(node.left);
          
          if (check) {
            context.report({
              node,
              messageId: 'unnecessaryNullishCoalesce',
              data: { type: check.typeString } satisfies MessageData,
              fix(fixer) {
                const leftText = context.sourceCode.getText(node.left);
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

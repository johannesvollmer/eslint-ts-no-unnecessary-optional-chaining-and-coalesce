import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import * as ts from 'typescript';

type MessageIds = 'unnecessaryOptionalChain' | 'unnecessaryNullishCoalesce';

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
      unnecessaryOptionalChain: 'Unnecessary optional chaining (?.) - TypeScript infers this value is never nullish.',
      unnecessaryNullishCoalesce: 'Unnecessary nullish coalescing (??) - TypeScript infers this value is never nullish.',
    },
    schema: [],
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

    function isNeverNullish(node: TSESTree.Node): boolean {
      const tsNode = services.esTreeNodeToTSNodeMap.get(node);
      const type = checker.getTypeAtLocation(tsNode);
      
      return !isNullish(type);
    }

    return {
      // Handle optional chaining: value?.property or call()?.property
      ChainExpression(node: TSESTree.ChainExpression) {
        if (node.expression.type === 'MemberExpression' && node.expression.optional) {
          // Check the object being accessed
          const object = node.expression.object;
          
          if (isNeverNullish(object)) {
            context.report({
              node: node,
              messageId: 'unnecessaryOptionalChain',
            });
          }
        } else if (node.expression.type === 'CallExpression' && node.expression.optional) {
          // Handle optional call expression
          const callee = node.expression.callee;
          
          if (isNeverNullish(callee)) {
            context.report({
              node: node,
              messageId: 'unnecessaryOptionalChain',
            });
          }
        }
      },

      // Handle nullish coalescing: value ?? fallback or call() ?? fallback
      LogicalExpression(node: TSESTree.LogicalExpression) {
        if (node.operator === '??') {
          const left = node.left;
          
          if (isNeverNullish(left)) {
            context.report({
              node: node,
              messageId: 'unnecessaryNullishCoalesce',
            });
          }
        }
      },
    };
  },
});

export default noUnnecessaryOptionalChainingAndCoalesce;

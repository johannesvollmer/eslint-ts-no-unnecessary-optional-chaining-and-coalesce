"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noUnnecessaryOptionalChainingAndCoalesce = void 0;
var utils_1 = require("@typescript-eslint/utils");
var ts = require("typescript");
exports.noUnnecessaryOptionalChainingAndCoalesce = utils_1.ESLintUtils.RuleCreator(function (name) { return "https://github.com/johannesvollmer/eslint-ts-no-unnecessary-optional-chaining-and-coalesce#".concat(name); })({
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
    create: function (context) {
        var services = utils_1.ESLintUtils.getParserServices(context);
        var checker = services.program.getTypeChecker();
        function isNullish(type) {
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
                return type.types.some(function (t) { return isNullish(t); });
            }
            return false;
        }
        function isNeverNullish(node) {
            var tsNode = services.esTreeNodeToTSNodeMap.get(node);
            var type = checker.getTypeAtLocation(tsNode);
            return !isNullish(type);
        }
        return {
            // Handle optional chaining: value?.property or call()?.property
            ChainExpression: function (node) {
                if (node.expression.type === 'MemberExpression' && node.expression.optional) {
                    // Check the object being accessed
                    var object = node.expression.object;
                    if (isNeverNullish(object)) {
                        context.report({
                            node: node,
                            messageId: 'unnecessaryOptionalChain',
                        });
                    }
                }
                else if (node.expression.type === 'CallExpression' && node.expression.optional) {
                    // Handle optional call expression
                    var callee = node.expression.callee;
                    if (isNeverNullish(callee)) {
                        context.report({
                            node: node,
                            messageId: 'unnecessaryOptionalChain',
                        });
                    }
                }
            },
            // Handle nullish coalescing: value ?? fallback or call() ?? fallback
            LogicalExpression: function (node) {
                if (node.operator === '??') {
                    var left = node.left;
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
exports.default = exports.noUnnecessaryOptionalChainingAndCoalesce;

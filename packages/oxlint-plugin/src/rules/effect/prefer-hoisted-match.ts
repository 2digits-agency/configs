import type { ESTree, Rule } from '@oxlint/plugins';

import {
  argumentAt,
  containsIdentifier,
  defineEffectRule,
  isApi,
  isApiPath,
  ruleMeta,
  staticPropertyName,
  unwrapExpression,
  walkNodes,
  type FileState,
  type FunctionNode,
} from '../../utils';
import { functionResult } from './utils';

function isParameterReference(node: ESTree.Expression | undefined, parameter: string): boolean {
  const expression = node === undefined ? undefined : unwrapExpression(node);

  return expression?.type === 'Identifier' && expression.name === parameter;
}

function isMatchValueOf(node: ESTree.Node | undefined, parameter: string, state: FileState): boolean {
  return (
    node?.type === 'CallExpression' &&
    node.arguments.length === 1 &&
    isApi(node.callee, state, 'Match', 'value') &&
    isParameterReference(argumentAt(node, 0), parameter)
  );
}

/**
 * `Match.value(param).pipe(…)` or `pipe(Match.value(param), …)`.
 *
 * @param node Function result.
 * @param parameter Name of the function's only parameter.
 * @param state Import bindings of the file.
 */
function isValuePipe(node: ESTree.CallExpression, parameter: string, state: FileState): boolean {
  if (node.callee.type === 'MemberExpression' && staticPropertyName(node.callee) === 'pipe') {
    return isMatchValueOf(node.callee.object, parameter, state);
  }

  return (
    (isApiPath(node.callee, state, ['pipe']) || isApiPath(node.callee, state, ['Function', 'pipe'])) &&
    isMatchValueOf(node.arguments[0], parameter, state)
  );
}

/**
 * The case object of `Match.valueTags(param, cases)` or `Match.valueTags(cases)(param)`.
 *
 * @param node Function result.
 * @param parameter Name of the function's only parameter.
 * @param state Import bindings of the file.
 */
function valueTagsCases(node: ESTree.CallExpression, parameter: string, state: FileState): ESTree.Node | undefined {
  if (isApi(node.callee, state, 'Match', 'valueTags')) {
    return node.arguments.length === 2 && isParameterReference(argumentAt(node, 0), parameter)
      ? node.arguments[1]
      : undefined;
  }

  const curried = node.callee;

  return curried.type === 'CallExpression' &&
    isApi(curried.callee, state, 'Match', 'valueTags') &&
    curried.arguments.length === 1 &&
    node.arguments.length === 1 &&
    isParameterReference(argumentAt(node, 0), parameter)
    ? curried.arguments[0]
    : undefined;
}

/**
 * `no-trivial-wrapper` already reports named functions that only forward their parameter to a call.
 *
 * @param node Function to inspect.
 */
function isNamedFunction(node: FunctionNode): boolean {
  return (
    (node.type !== 'ArrowFunctionExpression' && node.id !== null) ||
    (node.parent.type === 'VariableDeclarator' && node.parent.init === node)
  );
}

/**
 * Report functions that build a value matcher for their own parameter instead of reusing a hoisted type matcher.
 */
export const preferHoistedMatch: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Hoist Effect matchers with Match.type or Match.typeTags instead of wrapping Match.value or Match.valueTags in a function.',
    {
      value:
        'Replace this function with a hoisted `Match.type<…>().pipe(…)` matcher instead of calling `Match.value({{parameter}})` on every call. Case handlers already receive the narrowed value.',
      valueTags:
        'Replace this function with a hoisted `Match.typeTags<…>()({…})` or `Match.type<…>().pipe(Match.tagsExhaustive({…}))` matcher instead of calling `Match.valueTags` with `{{parameter}}`. Case handlers already receive the narrowed value.',
    },
    'https://www.effect.website/docs/v4/api/effect/Match',
  ),
  (context, getState) => {
    function check(node: FunctionNode): void {
      const parameter = node.params[0];

      if (
        node.params.length !== 1 ||
        parameter?.type !== 'Identifier' ||
        node.typeParameters ||
        node.async ||
        node.generator
      ) {
        return;
      }

      const result = functionResult(node);

      if (result?.type !== 'CallExpression' || walkNodes(result, (child) => child.type === 'ThisExpression')) {
        return;
      }

      const state = getState();

      if (isValuePipe(result, parameter.name, state)) {
        context.report({ node, messageId: 'value', data: { parameter: parameter.name } });

        return;
      }

      const cases = valueTagsCases(result, parameter.name, state);

      if (cases !== undefined && (!isNamedFunction(node) || containsIdentifier(cases, parameter.name))) {
        context.report({ node, messageId: 'valueTags', data: { parameter: parameter.name } });
      }
    }

    return {
      ArrowFunctionExpression: check,
      FunctionDeclaration: check,
      FunctionExpression: check,
    };
  },
);

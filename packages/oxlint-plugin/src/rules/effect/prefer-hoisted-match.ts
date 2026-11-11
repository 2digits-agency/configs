import { Diagnostic, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';

import {
  argumentAt,
  containsIdentifier,
  staticPropertyName,
  unwrapExpression,
  walkNodes,
  type FunctionNode,
} from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';
import { functionResult } from './internal/callbacks';

function isParameterReference(node: Opt.Option<ESTree.Expression>, parameter: string): boolean {
  return Opt.exists(node, (value) => {
    const expression = unwrapExpression(value);

    return expression.type === 'Identifier' && expression.name === parameter;
  });
}

function isMatchValueOf(node: ESTree.Node | undefined, parameter: string, imports: ImportBindings): boolean {
  return (
    node?.type === 'CallExpression' &&
    node.arguments.length === 1 &&
    imports.isApi(node.callee, 'Match', 'value') &&
    isParameterReference(argumentAt(node, 0), parameter)
  );
}

/**
 * `Match.value(param).pipe(…)` or `pipe(Match.value(param), …)`.
 *
 * @param node Function result.
 * @param parameter Name of the function's only parameter.
 * @param imports Import bindings of the file.
 */
function isValuePipe(node: ESTree.CallExpression, parameter: string, imports: ImportBindings): boolean {
  if (node.callee.type === 'MemberExpression' && Opt.contains(staticPropertyName(node.callee), 'pipe')) {
    return isMatchValueOf(node.callee.object, parameter, imports);
  }

  return (
    (imports.isApiPath(node.callee, ['pipe']) || imports.isApiPath(node.callee, ['Function', 'pipe'])) &&
    isMatchValueOf(node.arguments[0], parameter, imports)
  );
}

/**
 * The case object of `Match.valueTags(param, cases)` or `Match.valueTags(cases)(param)`.
 *
 * @param node Function result.
 * @param parameter Name of the function's only parameter.
 * @param imports Import bindings of the file.
 */
function valueTagsCases(
  node: ESTree.CallExpression,
  parameter: string,
  imports: ImportBindings,
): Opt.Option<ESTree.Node> {
  if (imports.isApi(node.callee, 'Match', 'valueTags')) {
    return node.arguments.length === 2 && isParameterReference(argumentAt(node, 0), parameter)
      ? Opt.fromNullishOr(node.arguments[1])
      : Opt.none();
  }

  const curried = node.callee;

  return curried.type === 'CallExpression' &&
    imports.isApi(curried.callee, 'Match', 'valueTags') &&
    curried.arguments.length === 1 &&
    node.arguments.length === 1 &&
    isParameterReference(argumentAt(node, 0), parameter)
    ? Arr.head(curried.arguments)
    : Opt.none();
}

/**
 * `no-trivial-wrapper` already reports named functions that only forward their parameter to a call.
 *
 * @param node Function to inspect.
 */
function isNamedFunction(node: FunctionNode): boolean {
  return (
    (node.type !== 'ArrowFunctionExpression' && P.isNotNull(node.id)) ||
    (node.parent.type === 'VariableDeclarator' && node.parent.init === node)
  );
}

/**
 * The only parameter of a plain synchronous, non-generic function with one identifier parameter.
 *
 * @param node Function.
 */
function soleParameter(node: FunctionNode): Opt.Option<ESTree.BindingIdentifier> {
  const [parameter] = node.params;

  return node.params.length === 1 &&
    parameter?.type === 'Identifier' &&
    !node.typeParameters &&
    !node.async &&
    !node.generator
    ? Opt.some(parameter)
    : Opt.none();
}

/**
 * The message for a function that builds a value matcher for its own parameter.
 *
 * @param node Function.
 * @param parameter Its only parameter.
 * @param imports Import bindings of the file.
 */
function matcherKind(
  node: FunctionNode,
  parameter: string,
  imports: ImportBindings,
): Opt.Option<'value' | 'valueTags'> {
  return Opt.flatMap(
    Opt.filter(
      functionResult(node),
      (result): result is ESTree.CallExpression =>
        result.type === 'CallExpression' && !walkNodes(result, (child) => child.type === 'ThisExpression'),
    ),
    (result) => {
      if (isValuePipe(result, parameter, imports)) {
        return Opt.some('value' as const);
      }

      return Opt.exists(
        valueTagsCases(result, parameter, imports),
        (cases) => !isNamedFunction(node) || containsIdentifier(cases, parameter),
      )
        ? Opt.some('valueTags' as const)
        : Opt.none();
    },
  );
}

/**
 * Report functions that build a value matcher for their own parameter instead of reusing a hoisted type matcher.
 */
export const preferHoistedMatch: CreateRule = defineRule({
  name: 'prefer-hoisted-match',
  meta: ruleMeta({
    type: 'suggestion',
    description:
      'Hoist Effect matchers with Match.type or Match.typeTags instead of wrapping Match.value or Match.valueTags in a function.',
    messages: {
      value:
        'Replace this function with a hoisted `Match.type<…>().pipe(…)` matcher instead of calling `Match.value({{parameter}})` on every call. Case handlers already receive the narrowed value.',
      valueTags:
        'Replace this function with a hoisted `Match.typeTags<…>()({…})` or `Match.type<…>().pipe(Match.tagsExhaustive({…}))` matcher instead of calling `Match.valueTags` with `{{parameter}}`. Case handlers already receive the narrowed value.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/Match',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    function check(node: FunctionNode) {
      return Opt.match(soleParameter(node), {
        onNone: () => Effect.void,
        onSome: ({ name }) =>
          Opt.match(matcherKind(node, name, imports), {
            onNone: () => Effect.void,
            onSome: (messageId) => ctx.report(Diagnostic.fromId({ node, messageId, data: { parameter: name } })),
          }),
      });
    }

    return Visitor.merge(
      Visitor.on('ArrowFunctionExpression', check),
      Visitor.on('FunctionDeclaration', check),
      Visitor.on('FunctionExpression', check),
    );
  },
});

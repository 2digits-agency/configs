import { Diagnostic, RuleContext, Visitor, type CreateRule, type ESTree, type OxlintSourceCode } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';

import {
  argumentAt,
  enclosingFunction,
  isLiteral,
  staticPropertyName,
  unwrapExpression,
  walkNodes,
} from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';
import { isGlobalIn } from '../../internal/scope';

type Emptiness = 'empty' | 'nonEmpty';

function isNewSet(node: ESTree.Node | null | undefined, sourceCode: OxlintSourceCode, site: ESTree.Node): boolean {
  return (
    node?.type === 'NewExpression' &&
    node.arguments.length === 1 &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'Set' &&
    isGlobalIn(sourceCode.getScope(site), node.callee, 'Set')
  );
}

/**
 * `[...new Set(xs)]` or `Array.from(new Set(xs))`.
 *
 * @param node Array literal or call.
 * @param sourceCode Source of the file; resolve scope only for a possible global Array or Set reference.
 */
function isSetDedupe(node: ESTree.ArrayExpression | ESTree.CallExpression, sourceCode: OxlintSourceCode): boolean {
  if (node.type === 'ArrayExpression') {
    const [element] = node.elements;

    return (
      node.elements.length === 1 && element?.type === 'SpreadElement' && isNewSet(element.argument, sourceCode, node)
    );
  }

  return (
    node.callee.type === 'MemberExpression' &&
    Opt.contains(staticPropertyName(node.callee), 'from') &&
    node.callee.object.type === 'Identifier' &&
    node.callee.object.name === 'Array' &&
    node.arguments.length === 1 &&
    isGlobalIn(sourceCode.getScope(node), node.callee.object, 'Array') &&
    Opt.exists(argumentAt(node, 0), (argument) => isNewSet(argument, sourceCode, node))
  );
}

function isWriteTarget(node: ESTree.MemberExpression): boolean {
  const parent = node.parent;

  return (
    (parent.type === 'AssignmentExpression' && parent.left === node) ||
    parent.type === 'UpdateExpression' ||
    (parent.type === 'UnaryExpression' && parent.operator === 'delete')
  );
}

/**
 * Whether `pair[0]` sits next to `pair[1]`, which reads a tuple: indexing is total there and Arr.head would add a
 * needless Option.
 *
 * @param node `x[0]` access.
 * @param sourceCode Source of the file.
 */
function isTupleAccess(node: ESTree.MemberExpression, sourceCode: OxlintSourceCode): boolean {
  const object = sourceCode.getText(node.object);

  return walkNodes(
    Opt.getOrElse(enclosingFunction(node), (): ESTree.Node => sourceCode.ast),
    (candidate) =>
      candidate.type === 'MemberExpression' &&
      candidate.computed &&
      candidate.property.type === 'Literal' &&
      P.isNumber(candidate.property.value) &&
      candidate.property.value !== 0 &&
      sourceCode.getText(candidate.object) === object,
  );
}

function isLengthAccess(node: ESTree.Node): boolean {
  return node.type === 'MemberExpression' && Opt.contains(staticPropertyName(node), 'length');
}

const emptinessChecks: Readonly<Record<string, Emptiness>> = {
  '!=': 'nonEmpty',
  '!==': 'nonEmpty',
  '==': 'empty',
  '===': 'empty',
};

/**
 * Whether a comparison checks `xs.length` against 0 for emptiness or non-emptiness.
 *
 * @param node Comparison.
 */
function lengthCheck(node: ESTree.BinaryExpression): Opt.Option<Emptiness> {
  const left = unwrapExpression(node.left);

  const right = unwrapExpression(node.right);

  if (isLengthAccess(left) && isLiteral(right, 0)) {
    return node.operator === '>' ? Opt.some('nonEmpty') : R.get(emptinessChecks, node.operator);
  }

  if (isLiteral(left, 0) && isLengthAccess(right)) {
    return node.operator === '<' ? Opt.some('nonEmpty') : R.get(emptinessChecks, node.operator);
  }

  return Opt.none();
}

function calleeName(node: ESTree.CallExpression): Opt.Option<string> {
  const callee = node.callee;

  if (callee.type === 'MemberExpression') {
    return staticPropertyName(callee);
  }

  return callee.type === 'Identifier' ? Opt.some(callee.name) : Opt.none();
}

/**
 * The key of `(x) => x.field`, without optional chaining, defaults, or a destructured parameter.
 *
 * @param node Callback.
 */
function accessorKey(node: ESTree.Node): Opt.Option<string> {
  if (node.type !== 'ArrowFunctionExpression' || node.async || !node.expression || node.params.length !== 1) {
    return Opt.none();
  }

  const [parameter] = node.params;

  const body = unwrapExpression(node.body as ESTree.Expression);

  return parameter?.type === 'Identifier' &&
    body.type === 'MemberExpression' &&
    body.object.type === 'Identifier' &&
    body.object.name === parameter.name
    ? staticPropertyName(body)
    : Opt.none();
}

/**
 * Prefer Effect Array and Struct helpers for array idioms the Effect language service does not report.
 */
export const preferEffectArrayOps: CreateRule = defineRule({
  name: 'prefer-effect-array-ops',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Effect Array and Struct helpers over hand-written array idioms in Effect files.',
    messages: {
      dedupe: 'Use Arr.dedupe instead of deduplicating through a Set.',
      head: 'Use Arr.head, which returns an Option, instead of indexing the first element (Tuple.get for tuples).',
      empty: 'Use Arr.isReadonlyArrayEmpty (Str.isEmpty for strings) instead of comparing `.length` with 0.',
      nonEmpty:
        'Use Arr.isReadonlyArrayNonEmpty (Str.isNonEmpty for strings), which narrows to a non-empty array, instead of comparing `.length` with 0.',
      structGet: "Use Struct.get('{{key}}') instead of a property accessor lambda.",
    },
    url: 'https://www.effect.website/docs/v4/api/effect/Array',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    function reportDedupe(node: ESTree.ArrayExpression | ESTree.CallExpression) {
      return isSetDedupe(node, ctx.sourceCode)
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'dedupe' }))
        : Effect.void;
    }

    function reportAccessors(node: ESTree.CallExpression) {
      return Opt.contains(calleeName(node), 'map')
        ? // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
          Effect.forEach(
            node.arguments,
            (argument) =>
              Opt.match(accessorKey(argument), {
                onNone: () => Effect.void,
                onSome: (key) =>
                  ctx.report(Diagnostic.fromId({ node: argument, messageId: 'structGet', data: { key } })),
              }),
            { discard: true },
          )
        : Effect.void;
    }

    return Visitor.merge(
      Visitor.on('ArrayExpression', reportDedupe),
      Visitor.on('CallExpression', (node) =>
        isSetDedupe(node, ctx.sourceCode)
          ? ctx.report(Diagnostic.fromId({ node, messageId: 'dedupe' }))
          : reportAccessors(node),
      ),
      Visitor.on('MemberExpression', (node) =>
        node.computed && isLiteral(node.property, 0) && !isWriteTarget(node) && !isTupleAccess(node, ctx.sourceCode)
          ? ctx.report(Diagnostic.fromId({ node, messageId: 'head' }))
          : Effect.void,
      ),
      Visitor.on('BinaryExpression', (node) =>
        Opt.match(lengthCheck(node), {
          onNone: () => Effect.void,
          onSome: (messageId) => ctx.report(Diagnostic.fromId({ node, messageId })),
        }),
      ),
    );
  },
});

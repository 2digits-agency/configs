import type { Context, ESTree, Rule } from '@oxlint/plugins';
import * as P from 'effect/Predicate';

import {
  argumentAt,
  defineEffectRule,
  enclosingFunction,
  isGlobalIdentifier,
  isLiteral,
  ruleMeta,
  staticPropertyName,
  unwrapExpression,
  walkNodes,
} from '../../utils';

function isNewSet(node: ESTree.Node | undefined, context: Context): boolean {
  return (
    node?.type === 'NewExpression' && node.arguments.length === 1 && isGlobalIdentifier(node.callee, context, 'Set')
  );
}

// `[...new Set(xs)]` and `Array.from(new Set(xs))`.
function isSetDedupe(node: ESTree.ArrayExpression | ESTree.CallExpression, context: Context): boolean {
  if (node.type === 'ArrayExpression') {
    const [element] = node.elements;

    return node.elements.length === 1 && element?.type === 'SpreadElement' && isNewSet(element.argument, context);
  }

  return (
    node.callee.type === 'MemberExpression' &&
    staticPropertyName(node.callee) === 'from' &&
    isGlobalIdentifier(node.callee.object, context, 'Array') &&
    node.arguments.length === 1 &&
    isNewSet(argumentAt(node, 0), context)
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

// `pair[0]` next to `pair[1]` reads a tuple, where indexing is total and Arr.head would add a needless Option.
function isTupleAccess(node: ESTree.MemberExpression, context: Context): boolean {
  const object = context.sourceCode.getText(node.object);

  return walkNodes(
    enclosingFunction(node) ?? context.sourceCode.ast,
    (candidate) =>
      candidate.type === 'MemberExpression' &&
      candidate.computed &&
      candidate.property.type === 'Literal' &&
      P.isNumber(candidate.property.value) &&
      candidate.property.value !== 0 &&
      context.sourceCode.getText(candidate.object) === object,
  );
}

function isLengthAccess(node: ESTree.Node): boolean {
  return node.type === 'MemberExpression' && staticPropertyName(node) === 'length';
}

const emptinessChecks: Readonly<Record<string, 'empty' | 'nonEmpty'>> = {
  '!=': 'nonEmpty',
  '!==': 'nonEmpty',
  '==': 'empty',
  '===': 'empty',
};

function lengthCheck(node: ESTree.BinaryExpression): 'empty' | 'nonEmpty' | undefined {
  const left = unwrapExpression(node.left);

  const right = unwrapExpression(node.right);

  if (isLengthAccess(left) && isLiteral(right, 0)) {
    return node.operator === '>' ? 'nonEmpty' : emptinessChecks[node.operator];
  }

  if (isLiteral(left, 0) && isLengthAccess(right)) {
    return node.operator === '<' ? 'nonEmpty' : emptinessChecks[node.operator];
  }

  return undefined;
}

function calleeName(node: ESTree.CallExpression): string | undefined {
  const callee = node.callee;

  if (callee.type === 'MemberExpression') {
    return staticPropertyName(callee);
  }

  return callee.type === 'Identifier' ? callee.name : undefined;
}

// `(x) => x.field`, without optional chaining, defaults, or a destructured parameter.
function accessorKey(node: ESTree.Node): string | undefined {
  if (node.type !== 'ArrowFunctionExpression' || node.async || !node.expression || node.params.length !== 1) {
    return undefined;
  }

  const [parameter] = node.params;

  const body = unwrapExpression(node.body as ESTree.Expression);

  if (
    parameter?.type !== 'Identifier' ||
    body.type !== 'MemberExpression' ||
    body.object.type !== 'Identifier' ||
    body.object.name !== parameter.name
  ) {
    return undefined;
  }

  return staticPropertyName(body);
}

/**
 * Prefer Effect Array and Struct helpers for array idioms the Effect language service does not report.
 */
export const preferEffectArrayOps: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer Effect Array and Struct helpers over hand-written array idioms in Effect files.',
    {
      dedupe: 'Use Arr.dedupe instead of deduplicating through a Set.',
      head: 'Use Arr.head, which returns an Option, instead of indexing the first element (Tuple.get for tuples).',
      empty: 'Use Arr.isReadonlyArrayEmpty (Str.isEmpty for strings) instead of comparing `.length` with 0.',
      nonEmpty:
        'Use Arr.isReadonlyArrayNonEmpty (Str.isNonEmpty for strings), which narrows to a non-empty array, instead of comparing `.length` with 0.',
      structGet: "Use Struct.get('{{key}}') instead of a property accessor lambda.",
    },
    'https://www.effect.website/docs/v4/api/effect/Array',
  ),
  (context, getState) => ({
    ArrayExpression(node) {
      if (getState().hasEffectImport && isSetDedupe(node, context)) {
        context.report({ node, messageId: 'dedupe' });
      }
    },
    CallExpression(node) {
      if (!getState().hasEffectImport) {
        return;
      }

      if (isSetDedupe(node, context)) {
        context.report({ node, messageId: 'dedupe' });

        return;
      }

      if (calleeName(node) !== 'map') {
        return;
      }

      for (const argument of node.arguments) {
        const key = accessorKey(argument);

        if (P.isNotUndefined(key)) {
          context.report({ node: argument, messageId: 'structGet', data: { key } });
        }
      }
    },
    MemberExpression(node) {
      if (
        getState().hasEffectImport &&
        node.computed &&
        isLiteral(node.property, 0) &&
        !isWriteTarget(node) &&
        !isTupleAccess(node, context)
      ) {
        context.report({ node, messageId: 'head' });
      }
    },
    BinaryExpression(node) {
      if (!getState().hasEffectImport) {
        return;
      }

      const check = lengthCheck(node);

      if (P.isNotUndefined(check)) {
        context.report({ node, messageId: check });
      }
    },
  }),
);

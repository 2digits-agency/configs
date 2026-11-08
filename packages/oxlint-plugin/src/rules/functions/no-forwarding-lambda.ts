import type { Context, ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as Str from 'effect/String';

import { canonicalPath, defineEffectRule, ruleMeta, type FileState, type FunctionNode } from '../../utils';
import { forwardedCall, isDetachableCallee } from './forwarding';

// Modules whose callbacks also receive an index or key, so `Arr.map(xs, f)` would pass `f` a second argument.
const indexedModules: ReadonlySet<string> = new Set([
  'Array',
  'Chunk',
  'HashMap',
  'HashSet',
  'Iterable',
  'MutableHashMap',
  'MutableHashSet',
  'Record',
  'Trie',
  'Tuple',
]);

// Callbacks of other modules, such as `Effect.forEach`, that also receive an index.
const indexedMembers: ReadonlySet<string> = new Set([
  'dropUntil',
  'dropWhile',
  'every',
  'exists',
  'filter',
  'filterMap',
  'findFirst',
  'forEach',
  'mapAccum',
  'partition',
  'reduce',
  'reduceRight',
  'some',
  'takeUntil',
  'takeWhile',
  'validate',
]);

function receivesOneArgument(call: ESTree.CallExpression, state: FileState): boolean {
  const path = canonicalPath(call.callee, state);

  const module = path?.[0];

  const member = path?.at(-1);

  return (
    module !== undefined &&
    member !== undefined &&
    path?.length === 2 &&
    !indexedModules.has(module) &&
    !indexedMembers.has(member)
  );
}

function check(context: Context, state: FileState, node: FunctionNode): void {
  const parent = node.parent;

  if (
    parent.type !== 'CallExpression' ||
    !Arr.contains(parent.arguments, node) ||
    !receivesOneArgument(parent, state)
  ) {
    return;
  }

  const forwarding = forwardedCall(node);

  if (forwarding === undefined || !forwarding.exact || !isDetachableCallee(forwarding.call.callee, state)) {
    return;
  }

  const callee = context.sourceCode.getText(forwarding.call.callee);

  context.report({
    node,
    messageId: 'forwardingLambda',
    data: { callee: Str.includes('\n')(callee) ? 'the callee' : `\`${callee}\`` },
  });
}

/**
 * Report callbacks of Effect APIs that only pass their parameters on, such as `Effect.map((value) => f(value))`.
 */
export const noForwardingLambda: Rule = defineEffectRule(
  ruleMeta('suggestion', 'Disallow Effect callbacks that only forward their parameters to another function.', {
    forwardingLambda: 'This callback only passes its parameters to {{callee}}. Pass {{callee}} directly.',
  }),
  (context, getState) => ({
    ArrowFunctionExpression(node) {
      check(context, getState(), node);
    },
    FunctionExpression(node) {
      check(context, getState(), node);
    },
  }),
);

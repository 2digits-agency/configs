import type { Context, ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as P from 'effect/Predicate';
import * as Str from 'effect/String';

import { canonicalPath, defineEffectRule, ruleMeta, type FileState, type FunctionNode } from '../../utils';
import { forwardedCall, isDetachableCallee, isEffectGuard, isTypeGuard } from './forwarding';

// Modules whose callbacks also receive an index or key, so `Arr.map(xs, f)` would pass `f` a second argument.
const indexedModules: ReadonlySet<string> = new Set([
  'Array',
  'Chunk',
  'HashMap',
  'HashSet',
  'Iterable',
  'MutableHashMap',
  'MutableHashSet',
  'MutableList',
  'Record',
  'Trie',
  'Tuple',
  'TxChunk',
  'TxHashMap',
]);

/*
 * Other Effect APIs whose callbacks receive more than one argument, such as an index, the `Exit` of
 * `Effect.acquireRelease` or the accumulator of `Stream.scan`, found from the callback signatures in the `effect` 4.1
 * declarations. Passing a function directly would give it those extra arguments.
 */
const multiArgumentApis: ReadonlySet<string> = new Set([
  'Channel.acquireRelease',
  'Channel.acquireUseRelease',
  'Channel.catchCauseFilter',
  'Channel.catchReason',
  'Channel.combine',
  'Channel.filterArrayEffect',
  'Channel.fromTransform',
  'Channel.fromTransformBracket',
  'Channel.map',
  'Channel.mapAccum',
  'Channel.mapEffect',
  'Channel.runFold',
  'Channel.runFoldEffect',
  'Channel.scan',
  'Channel.scanEffect',
  'Channel.transformPull',
  'Combiner.make',
  'Duration.matchPair',
  'Effect.acquireRelease',
  'Effect.acquireUseRelease',
  'Effect.catchCauseFilter',
  'Effect.catchReason',
  'Effect.effectify',
  'Effect.filter',
  'Effect.findFirst',
  'Effect.findFirstFilter',
  'Effect.forEach',
  'Effect.onErrorFilter',
  'Effect.onExitFilter',
  'Effect.partition',
  'Effect.reduce',
  'Effect.repeatOrElse',
  'Effect.retryOrElse',
  'Effect.tapCauseFilter',
  'Effect.validate',
  'Effect.zipWith',
  'Equivalence.make',
  'Filter.zipWith',
  'Graph.complement',
  'Graph.findEdge',
  'Graph.findEdges',
  'Graph.floydWarshall',
  'Layer.fromBuild',
  'Layer.fromBuildMemo',
  'Metric.mapInput',
  'Optic.fromChecks',
  'Optic.makeLens',
  'Optic.makeOptional',
  'Option.containsWith',
  'Option.lift2',
  'Option.reduceCompact',
  'Option.zipWith',
  'Order.make',
  'Reducer.make',
  'RequestResolver.around',
  'RequestResolver.make',
  'RequestResolver.makeGrouped',
  'RequestResolver.makeWith',
  'Schema.makeFilter',
  'Schema.makeIsMultipleOf',
  'Schema.middlewareDecoding',
  'Schema.middlewareEncoding',
  'SchemaGetter.checkEffect',
  'SchemaGetter.fail',
  'SchemaGetter.transformEffect',
  'SchemaGetter.transformOptionalEffect',
  'SchemaTransformation.transformEffect',
  'Sink.fold',
  'Sink.foldArray',
  'Sink.foldUntil',
  'Sink.fromTransform',
  'Sink.reduce',
  'Sink.reduceArray',
  'Sink.reduceEffect',
  'Sink.reduceWhile',
  'Sink.reduceWhileArray',
  'Sink.reduceWhileArrayEffect',
  'Sink.reduceWhileEffect',
  'Sink.summarized',
  'Stream.catchCauseFilter',
  'Stream.catchReason',
  'Stream.changesWith',
  'Stream.changesWithEffect',
  'Stream.combine',
  'Stream.combineArray',
  'Stream.crossWith',
  'Stream.dropUntil',
  'Stream.dropUntilEffect',
  'Stream.dropWhile',
  'Stream.dropWhileEffect',
  'Stream.filterEffect',
  'Stream.map',
  'Stream.mapAccum',
  'Stream.mapAccumArray',
  'Stream.mapAccumArrayEffect',
  'Stream.mapAccumEffect',
  'Stream.mapArray',
  'Stream.mapArrayEffect',
  'Stream.mapEffect',
  'Stream.runFold',
  'Stream.runFoldEffect',
  'Stream.scan',
  'Stream.scanEffect',
  'Stream.takeUntil',
  'Stream.takeUntilEffect',
  'Stream.takeWhile',
  'Stream.takeWhileEffect',
  'Stream.transformPull',
  'Stream.transformPullBracket',
  'Stream.zipLatestWith',
  'Stream.zipWith',
  'Stream.zipWithArray',
  'TextDiff.diffWith',
  'TxHashSet.reduce',
]);

function receivesOneArgument(call: ESTree.CallExpression, state: FileState): boolean {
  const path = canonicalPath(call.callee, state);

  return (
    P.isNotUndefined(path) &&
    Arr.isReadonlyArrayNonEmpty(path) &&
    path.length === 2 &&
    !indexedModules.has(Arr.headNonEmpty(path)) &&
    !multiArgumentApis.has(Arr.join(path, '.'))
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

  if (
    P.isUndefined(forwarding) ||
    !forwarding.exact ||
    !isDetachableCallee(forwarding.call.callee, state) ||
    // A type predicate, as `Schema.declare` needs, is lost when passing a callee that only returns `boolean`.
    (isTypeGuard(node) && !isEffectGuard(forwarding.call.callee, state))
  ) {
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

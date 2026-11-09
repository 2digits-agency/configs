import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { callbackCall, type FunctionNode } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { forwardedCall, isDetachableCallee, isEffectGuard, isTypeGuard, type Forwarding } from './internal/forwarding';

// Modules whose callbacks also receive an index or key, so `Arr.map(xs, f)` would pass `f` a second argument.
const isIndexedModule = Schema.is(
  Schema.Literals([
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
  ]),
);

/*
 * Other Effect APIs whose callbacks receive more than one argument, such as an index, the `Exit` of
 * `Effect.acquireRelease` or the accumulator of `Stream.scan`, found from the callback signatures in the `effect` 4.1
 * declarations. Passing a function directly would give it those extra arguments.
 */
const isMultiArgumentApi = Schema.is(
  Schema.Literals([
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
  ]),
);

/*
 * Modules whose handlers take their parameter type from the pattern, such as `Match.tag('Known', (known) => …)`. A
 * generic function passed instead, such as `Opt.some`, has nothing to infer from and gets `unknown`.
 */
const isContextualModule = Schema.is(Schema.Literals(['Match']));

function receivesOneArgument(call: ESTree.CallExpression, imports: ImportBindings): boolean {
  return Opt.exists(
    imports.path(call.callee),
    (path) =>
      path.length === 2 &&
      !Opt.exists(Arr.head(path), (module) => isIndexedModule(module) || isContextualModule(module)) &&
      !isMultiArgumentApi(Arr.join(path, '.')),
  );
}

/**
 * The call a callback forwards to, when the Effect API that receives it passes one argument and the callee can replace
 * the callback as is.
 *
 * @param node Callback.
 * @param imports Import bindings of the file.
 */
function replaceableForwarding(node: FunctionNode, imports: ImportBindings): Opt.Option<Forwarding> {
  return callbackCall(node).pipe(
    Opt.filter((parent) => receivesOneArgument(parent, imports)),
    Opt.flatMap(() => forwardedCall(node)),
    Opt.filter(
      ({ exact, call }) =>
        exact &&
        isDetachableCallee(call.callee, imports) &&
        // A type predicate, as `Schema.declare` needs, is lost when passing a callee that only returns `boolean`.
        (!isTypeGuard(node) || isEffectGuard(call.callee, imports)),
    ),
  );
}

/**
 * Report callbacks of Effect APIs that only pass their parameters on, such as `Effect.map((value) => f(value))`.
 */
export const noForwardingLambda: CreateRule = Rule.define({
  name: 'no-forwarding-lambda',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Disallow Effect callbacks that only forward their parameters to another function.',
    messages: {
      forwardingLambda: 'This callback only passes its parameters to {{callee}}. Pass {{callee}} directly.',
    },
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    function check(node: FunctionNode) {
      return Opt.match(replaceableForwarding(node, imports), {
        onNone: () => Effect.void,
        onSome: ({ call }) => {
          const callee = ctx.sourceCode.getText(call.callee);

          return ctx.report(
            Diagnostic.fromId({
              node,
              messageId: 'forwardingLambda',
              data: { callee: Str.includes('\n')(callee) ? 'the callee' : `\`${callee}\`` },
            }),
          );
        },
      });
    }

    return Visitor.merge(Visitor.on('ArrowFunctionExpression', check), Visitor.on('FunctionExpression', check));
  },
});

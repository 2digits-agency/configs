import type * as Modules from 'effect';
import type * as Effect from 'effect/Effect';
import type * as Match from 'effect/Match';
import type * as Opt from 'effect/Option';
import type * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';

/**
 * A module of the `effect` package, such as `Option`, or a function it exports from its root, such as `pipe`.
 */
type ModuleName = keyof typeof Modules;

/**
 * An Effect API as `Module.member`, such as `Stream.mapAccum`.
 */
type ModuleApi = {
  [M in ModuleName]: `${M}.${Extract<keyof (typeof Modules)[M], string>}`;
}[ModuleName];

type EffectApi = keyof typeof Effect;

type SchemaApi = keyof typeof Schema;

/**
 * Error handlers of `Effect`. The current Effect types no longer export the Effect v3 names, so they are not checked.
 */
export const CatchMethod = Schema.Literals([
  ...(['catch', 'catchIf', 'catchTag', 'orElseSucceed'] satisfies ReadonlyArray<EffectApi>),
  'catchAll',
  'catchAllCause',
  'catchSome',
  'catchSomeCause',
  'orElse',
  'orElseFail',
]);

/**
 * Handlers that catch any failure, not one tag.
 */
export const BroadCatchName = CatchMethod.pick(['catch', 'catchAll', 'catchIf']);

/**
 * Handlers that receive the failure and can wrap it.
 */
export const ErrorHandlerMethod = Schema.Literals([
  ...CatchMethod.pick(['catch', 'catchAll']).literals,
  'mapError' satisfies EffectApi,
]);

export const PureCallbackMethod = Schema.Literals([
  ...(['andThen', 'map', 'mapError', 'tap', 'tapError'] satisfies ReadonlyArray<EffectApi>),
  // Effect v3 name, which the current Effect types no longer export.
  'tapErrorCause',
]);

export const LogMethod = Schema.Literals([
  'log',
  'logDebug',
  'logError',
  'logInfo',
  'logTrace',
  'logWarning',
] satisfies ReadonlyArray<EffectApi>);

export const EffectIo = Schema.Literals(['promise', 'tryPromise'] satisfies ReadonlyArray<EffectApi>);

export const MatchPatternName = Schema.Literals(['when', 'not'] satisfies ReadonlyArray<keyof typeof Match>);

export const ThrowingModule = Schema.Literals(['Option', 'Result'] satisfies ReadonlyArray<ModuleName>);

export const ThrowingGetter = Schema.Literals(['getOrThrow', 'getOrThrowWith'] satisfies ReadonlyArray<
  keyof typeof Opt & keyof typeof Result
>);

/**
 * Modules whose functions build immutable values or lazy descriptions, so calling them once at module load is the same
 * as calling them on every use.
 */
export const PureModule = Schema.Literals([
  'BigDecimal',
  'Config',
  'Data',
  'DateTime',
  'Duration',
  'Effect',
  'Equivalence',
  'Exit',
  'Function',
  'Layer',
  'Match',
  'Option',
  'Order',
  'Predicate',
  'Result',
  'Schedule',
  'Schema',
  'Stream',
  'String',
  'Struct',
  'flow',
  'pipe',
] satisfies ReadonlyArray<ModuleName>);

/*
 * Modules whose functions call their callbacks right away, such as `Option.map(some, f)` or `pipe(value, f)`, so the
 * result is only constant when no function argument can read changing state.
 */
export const EagerModule = PureModule.pick([
  'BigDecimal',
  'Data',
  'DateTime',
  'Duration',
  'Exit',
  'Option',
  'Result',
  'String',
  'Struct',
  'pipe',
]);

export const EagerMember = Schema.Literals(['pipe', 'value', 'valueTags']);

// Modules whose callbacks also receive an index or key, so `Arr.map(xs, f)` would pass `f` a second argument.
export const IndexedModule = Schema.Literals([
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
] satisfies ReadonlyArray<ModuleName>);

/*
 * Other Effect APIs whose callbacks receive more than one argument, such as an index, the `Exit` of
 * `Effect.acquireRelease` or the accumulator of `Stream.scan`, found from the callback signatures in the `effect` 4.1
 * declarations. Passing a function directly would give it those extra arguments.
 */
export const MultiArgumentApi = Schema.Literals([
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
] satisfies ReadonlyArray<ModuleApi>);

/*
 * Modules whose handlers take their parameter type from the pattern, such as `Match.tag('Known', (known) => …)`. A
 * generic function passed instead, such as `Opt.some`, has nothing to infer from and gets `unknown`.
 */
export const ContextualModule = Schema.Literals(['Match'] satisfies ReadonlyArray<ModuleName>);

// Lists follow docs/adr/0001 for the catalog's Effect version; revisit them when Effect adds Schema functions.
export const Modifier = Schema.Literals([
  'flip',
  'fromFormData',
  'fromJsonString',
  'fromURLSearchParams',
  'mutable',
  'mutableKey',
  'NullishOr',
  'NullOr',
  'optional',
  'optionalKey',
  'OptionFromNullishOr',
  'OptionFromNullOr',
  'OptionFromOptional',
  'OptionFromOptionalKey',
  'OptionFromOptionalNullOr',
  'OptionFromUndefinedOr',
  'readonlyKey',
  'RedactedFromValue',
  'required',
  'requiredKey',
  'toCodecArrayFromSingle',
  'toCodecGoJson',
  'toCodecIso',
  'toCodecJson',
  'toCodecStringTree',
  'toEncoded',
  'toType',
  'UndefinedOr',
] satisfies ReadonlyArray<SchemaApi>);

/**
 * Modifiers that only allow a missing or empty value around the schema.
 */
export const SchemaWrapper = Modifier.pick(['NullOr', 'NullishOr', 'UndefinedOr', 'optional', 'optionalKey']);

export const Wrapper = Schema.Literals([
  'Array',
  'ArrayEnsure',
  'Chunk',
  'HashSet',
  'NonEmptyArray',
  'Option',
  'ReadonlySet',
  'Redacted',
  'Tree',
  'UniqueArray',
] satisfies ReadonlyArray<SchemaApi>);

export const DataLastStep = Schema.Literals([
  'annotate',
  'annotateEncoded',
  'annotateKey',
  'brand',
  'catchDecoding',
  'catchDecodingWithContext',
  'catchEncoding',
  'catchEncodingWithContext',
  'check',
  'decode',
  'decodeTo',
  'encode',
  'encodeKeys',
  'encodeTo',
  'extendTo',
  'fieldsAssign',
  'fromBrand',
  'middlewareDecoding',
  'middlewareEncoding',
  'overrideToCodecIso',
  'overrideToEquivalence',
  'overrideToFormatter',
  'refine',
  'toTaggedUnion',
  'withConstructorDefault',
  'withDecodingDefault',
  'withDecodingDefaultKey',
  'withDecodingDefaultType',
  'withDecodingDefaultTypeKey',
] satisfies ReadonlyArray<SchemaApi>);

export const AnnotateMethod = DataLastStep.pick(['annotate', 'annotateEncoded', 'annotateKey']);

// Pipe steps that keep a number a number. Any other step, such as `Schema.decodeTo(Schema.Duration, ...)`, may not.
export const NumberPreservingStepName = DataLastStep.pick([
  'annotate',
  'annotateKey',
  'brand',
  'check',
  'withConstructorDefault',
  'withDecodingDefault',
  'withDecodingDefaultKey',
]);

// Schema methods that return a schema, so a head built from them still has `.pipe`.
export const SchemaMethod = Schema.Literals(['annotate', 'annotateKey', 'check', 'mapFields'] satisfies ReadonlyArray<
  keyof Schema.Struct<Schema.Struct.Fields>
>);

export const NumberMethod = SchemaMethod.pick(['annotate', 'check']);

export const SchemaMapMethod = Schema.Literals(['mapElements', 'mapFields', 'mapMembers'] satisfies ReadonlyArray<
  | keyof Schema.Struct<Schema.Struct.Fields>
  | keyof Schema.Tuple<Schema.Tuple.Elements>
  | keyof Schema.Union<ReadonlyArray<Schema.Constraint>>
>);

export const NumberSchemaName = Schema.Literals([
  'Finite',
  'FiniteFromString',
  'Int',
  'Number',
  'NumberFromString',
] satisfies ReadonlyArray<SchemaApi>);

export const CompilerMethod = Schema.Literals([
  'asserts',
  'decodeEffect',
  'decodeExit',
  'decodeOption',
  'decodePromise',
  'decodeResult',
  'decodeSync',
  'decodeUnknownEffect',
  'decodeUnknownExit',
  'decodeUnknownOption',
  'decodeUnknownPromise',
  'decodeUnknownResult',
  'decodeUnknownSync',
  'encodeEffect',
  'encodeExit',
  'encodeOption',
  'encodePromise',
  'encodeResult',
  'encodeSync',
  'encodeUnknownEffect',
  'encodeUnknownExit',
  'encodeUnknownOption',
  'encodeUnknownPromise',
  'encodeUnknownResult',
  'encodeUnknownSync',
  'is',
] satisfies ReadonlyArray<SchemaApi>);

import type * as EffectBarrel from 'effect';
import type { Definition, ESTree, OxlintSourceCode } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';
import * as Struct from 'effect/Struct';
import * as Tuple from 'effect/Tuple';

import {
  callbackCall,
  containsRange,
  isConstDeclaration,
  isFunctionNode,
  walkNodes,
  type FunctionNode,
} from '../../../internal/ast';
import type { ImportBindings } from '../../../internal/imports';
import { functionResult } from '../../effect/internal/callbacks';

export interface Forwarding {
  /**
   * The call the function returns.
   */
  readonly call: ESTree.CallExpression;
  /**
   * Whether the call receives only the parameters, so the callee could replace the function as is.
   */
  readonly exact: boolean;
}

const isGuardName = Schema.is(Schema.String.check(Schema.isPattern(/^is\p{Lu}/u)));

function parameterName(parameter: ESTree.ParamPattern): Opt.Option<string> {
  if (parameter.type === 'Identifier') {
    return Opt.some(parameter.name);
  }

  return parameter.type === 'RestElement' && parameter.argument.type === 'Identifier'
    ? Opt.some(parameter.argument.name)
    : Opt.none();
}

function referencesAny(node: ESTree.Node, names: ReadonlyArray<string>): boolean {
  return walkNodes(
    node,
    (child) => child.type === 'ThisExpression' || (child.type === 'Identifier' && Arr.contains(names, child.name)),
  );
}

// The parameter an argument passes on unchanged: `x` for parameter `x`, `...rest` for rest parameter `rest`.
function forwardedName(argument: ESTree.CallExpression['arguments'][number], node: FunctionNode): Opt.Option<string> {
  const rest = Arr.last(node.params).pipe(
    Opt.filter((last) => last.type === 'RestElement'),
    Opt.flatMap(parameterName),
  );

  if (argument.type === 'SpreadElement') {
    return Opt.filter(rest, (name) => argument.argument.type === 'Identifier' && argument.argument.name === name);
  }

  return argument.type === 'Identifier' && !Opt.contains(rest, argument.name) ? Opt.some(argument.name) : Opt.none();
}

/**
 * The parameters a call forwards unchanged, in order, or none when another argument depends on a parameter or is a
 * function itself, such as the callback of `Arr.map(values, (value) => …)`, which carries the logic.
 *
 * @param call Returned call.
 * @param node Function that returns it.
 * @param names Parameter names of the function.
 */
function forwardedNames(
  call: ESTree.CallExpression,
  node: FunctionNode,
  names: ReadonlyArray<string>,
): Opt.Option<ReadonlyArray<string>> {
  return Opt.all(
    Arr.flatMap(call.arguments, (argument) =>
      forwardedName(argument, node).pipe(
        Opt.filter((name) => Arr.contains(names, name)),
        Opt.match({
          onSome: (name) => [Opt.some(name)],
          onNone: () => (isFunctionNode(argument) || referencesAny(argument, names) ? [Opt.none<string>()] : []),
        }),
      ),
    ),
  );
}

/**
 * The call a function only forwards its parameters to: the function returns one call that receives every parameter
 * once, unchanged and in order, while its callee and other arguments do not depend on the parameters and are not
 * functions themselves.
 *
 * @param node Function to inspect.
 */
export function forwardedCall(node: FunctionNode): Opt.Option<Forwarding> {
  if (node.async || node.generator || node.typeParameters) {
    return Opt.none();
  }

  return Opt.zipWith(
    // The parameter names, or none when a parameter is destructured or has a default.
    Opt.filter(Opt.all(Arr.map(node.params, parameterName)), Arr.isReadonlyArrayNonEmpty),
    Opt.filter(
      functionResult(node),
      (expression): expression is ESTree.CallExpression => expression.type === 'CallExpression' && !expression.optional,
    ),
    (names, call) => ({ names, call }),
  ).pipe(
    Opt.flatMap(({ names, call }) =>
      call.callee.type === 'Super' || referencesAny(call.callee, names)
        ? Opt.none()
        : forwardedNames(call, node, names).pipe(
            Opt.filter((forwarded) => Arr.makeEquivalence(Str.Equivalence)(forwarded, names)),
            Opt.map(() => ({ call, exact: call.arguments.length === names.length })),
          ),
    ),
  );
}

/**
 * Whether a function declares a type predicate, such as `node is FunctionNode`, which its body may not provide.
 *
 * @param node Function to inspect.
 */
export function isTypeGuard(node: FunctionNode): boolean {
  return node.returnType?.typeAnnotation.type === 'TSTypePredicate';
}

/**
 * Whether a callee is already an Effect guard, such as `Schema.is(User)` or `P.isString`, so a type predicate wrapped
 * around it adds nothing.
 *
 * @param callee Callee of the forwarded call.
 * @param imports Import bindings of the file.
 */
export function isEffectGuard(callee: ESTree.Expression | ESTree.Super, imports: ImportBindings): boolean {
  const target = callee.type === 'CallExpression' ? callee.callee : callee;

  return Opt.exists(imports.path(target), (path) =>
    Arr.get(path, 1).pipe(
      Opt.filter(() => path.length === 2),
      Opt.exists((member) => (Opt.contains(Arr.head(path), 'Schema') ? member === 'is' : isGuardName(member))),
    ),
  );
}

/**
 * Whether a callee can be passed as a value without losing `this` or changing when it is built: a binding, an imported
 * module function, or an Effect API call that builds a function, such as `Schema.is(User)`. A call to any other factory
 * runs on every call of the wrapper, and only once after passing its result.
 *
 * @param node Callee of the forwarded call.
 * @param imports Import bindings of the file.
 */
export function isDetachableCallee(node: ESTree.Expression | ESTree.Super, imports: ImportBindings): boolean {
  if (node.type === 'Identifier') {
    return true;
  }

  if (node.type === 'MemberExpression') {
    return Opt.isSome(imports.path(node));
  }

  return (
    node.type === 'CallExpression' && node.callee.type !== 'Identifier' && isDetachableCallee(node.callee, imports)
  );
}

/**
 * Whether a binding the callee reads already holds its final value wherever the callback is created. Passing the callee
 * reads the binding then, not when the callback runs: a `let` may change after it, and a `const` declared later, or
 * read from a hoisted function that may run before the declaration, throws.
 *
 * @param definition Definition of the binding.
 * @param callback Callback that would be replaced.
 */
function isSettledAt(definition: Definition, callback: FunctionNode): boolean {
  // A named function expression's own name is gone once the callback is.
  if (containsRange(callback, definition.name)) {
    return false;
  }

  if (definition.type !== 'Variable' && definition.type !== 'ClassName') {
    return true;
  }

  if (definition.type === 'Variable' && !isConstDeclaration(definition.parent)) {
    return false;
  }

  return (
    Tuple.get(definition.node.range, 1) <= Tuple.get(callback.range, 0) && !hoistedBetween(callback, definition.node)
  );
}

function hoistedBetween(node: ESTree.Node, declaration: ESTree.Node): boolean {
  const parent = node.parent as ESTree.Node | null | undefined;

  if (!parent || containsRange(parent, declaration)) {
    return false;
  }

  return parent.type === 'FunctionDeclaration' || hoistedBetween(parent, declaration);
}

/**
 * Whether every binding a callee reads is settled where the callback is created and never reassigned afterwards, as a
 * function declaration or parameter can be: the callback reads the new value, the passed callee keeps the old one.
 *
 * @param sourceCode Source of the file.
 * @param callee Forwarded callee.
 * @param callback Callback that would be replaced.
 */
export function isSettledCallee(
  sourceCode: OxlintSourceCode,
  callee: ESTree.Expression | ESTree.Super,
  callback: FunctionNode,
): boolean {
  return Arr.every(
    Arr.filter(sourceCode.getScope(callee).references, ({ identifier }) => containsRange(callee, identifier)),
    ({ resolved }) =>
      !resolved ||
      (!Arr.some(resolved.references, (reference) => reference.isWrite() && !reference.init) &&
        Arr.every(resolved.defs, (definition) => isSettledAt(definition, callback))),
  );
}

// The modules of the `effect` barrel, such as `Effect` or `Array`, without its functions such as `pipe`.
type EffectModule = Extract<keyof typeof EffectBarrel, Capitalize<keyof typeof EffectBarrel>>;

/*
 * The parameter lists of every overload of a function, for up to ten overloads; no `effect` 4.1 API has more than
 * eight. A function with fewer overloads also matches, and the extra lists hold no callbacks.
 */
/* eslint-disable ts/method-signature-style -- Method signatures compare parameters bivariantly, so an overload whose
 * parameters only resolve to `never` once its type parameters are erased, such as `Effect.catchReason`, still matches.
 */
type CallParameters<T> = T extends {
  call(...args: infer TArgs1): unknown;

  call(...args: infer TArgs2): unknown;

  call(...args: infer TArgs3): unknown;

  call(...args: infer TArgs4): unknown;

  call(...args: infer TArgs5): unknown;

  call(...args: infer TArgs6): unknown;

  call(...args: infer TArgs7): unknown;

  call(...args: infer TArgs8): unknown;

  call(...args: infer TArgs9): unknown;

  call(...args: infer TArgs10): unknown;
}['call']
  ? TArgs1 | TArgs2 | TArgs3 | TArgs4 | TArgs5 | TArgs6 | TArgs7 | TArgs8 | TArgs9 | TArgs10
  : never;
/* eslint-enable ts/method-signature-style */

type IsAny<T> = 0 extends 1 & T ? true : false;

// `true` for a function that receives more than one argument, including a rest parameter.
type MultiArgumentCallback<T> =
  IsAny<T> extends true
    ? never
    : T extends (...args: infer TArgs) => unknown
      ? TArgs['length'] extends 0 | 1
        ? never
        : true
      : never;

// Per position, because indexing the tuple with `number` merges a callback with an `unknown` parameter into `unknown`.
type MultiArgumentParameters<TArgs> =
  TArgs extends ReadonlyArray<unknown>
    ? { readonly [TIndex in keyof TArgs]: MultiArgumentCallback<TArgs[TIndex]> }[number]
    : never;

/*
 * Every Effect API with a parameter that is a function receiving more than one argument, such as the index of
 * `Stream.map`, the `Exit` of `Effect.acquireRelease`, the accumulator of `Stream.scan` or the two values an `Order`
 * compares. Passing a function there directly would give it those extra arguments.
 */
type MultiArgumentApi = {
  readonly [TModule in EffectModule]: {
    readonly [TMember in Extract<keyof (typeof EffectBarrel)[TModule], string>]: true extends MultiArgumentParameters<
      CallParameters<(typeof EffectBarrel)[TModule][TMember]>
    >
      ? `${TModule}.${TMember}`
      : never;
  }[Extract<keyof (typeof EffectBarrel)[TModule], string>];
}[EffectModule];

/*
 * Collection modules whose callbacks can receive an index or key, so `Arr.map(xs, f)` would pass `f` a second argument.
 * They are exempt as a whole because their types do not always show it: `Chunk.filter` declares a one-argument
 * predicate but delegates to `Array.filter`, which also passes the index.
 */
const indexedModules = [
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
] as const satisfies ReadonlyArray<EffectModule>;

const isIndexedModule = Schema.is(Schema.Literals(indexedModules));

/*
 * Modules whose handlers take their parameter type from the pattern, such as `Match.tag('Known', (known) => …)`. A
 * generic function passed instead, such as `Opt.some`, has nothing to infer from and gets `unknown`.
 */
const contextualModules = ['Match'] as const satisfies ReadonlyArray<EffectModule>;

const isContextualModule = Schema.is(Schema.Literals(contextualModules));

/*
 * The multi-argument APIs of the other modules. `satisfies` keeps this list equal to `MultiArgumentApi`: an `effect`
 * update that adds one fails as a missing property, and one that drops one fails as an unknown property.
 */
const multiArgumentApis = {
  'Channel.acquireRelease': true,
  'Channel.acquireUseRelease': true,
  'Channel.catchCauseFilter': true,
  'Channel.catchReason': true,
  'Channel.catchReasons': true,
  'Channel.combine': true,
  'Channel.filterArrayEffect': true,
  'Channel.fromTransform': true,
  'Channel.fromTransformBracket': true,
  'Channel.map': true,
  'Channel.mapAccum': true,
  'Channel.mapEffect': true,
  'Channel.runFold': true,
  'Channel.runFoldEffect': true,
  'Channel.scan': true,
  'Channel.scanEffect': true,
  'Channel.transformPull': true,
  'Combiner.make': true,
  'Combiner.max': true,
  'Combiner.min': true,
  'Effect.acquireRelease': true,
  'Effect.acquireUseRelease': true,
  'Effect.callback': true,
  'Effect.catchCauseFilter': true,
  'Effect.catchReason': true,
  'Effect.catchReasons': true,
  'Effect.effectify': true,
  'Effect.filter': true,
  'Effect.findFirst': true,
  'Effect.findFirstFilter': true,
  'Effect.fn': true,
  'Effect.fnUntraced': true,
  'Effect.fnUntracedEager': true,
  'Effect.forEach': true,
  'Effect.onErrorFilter': true,
  'Effect.onExitFilter': true,
  'Effect.partition': true,
  'Effect.reduce': true,
  'Effect.repeatOrElse': true,
  'Effect.retryOrElse': true,
  'Effect.tapCauseFilter': true,
  'Effect.validate': true,
  'Effect.withSpan': true,
  'Effect.zipWith': true,
  'Equivalence.Array': true,
  'Equivalence.Record': true,
  'Equivalence.combine': true,
  'Equivalence.make': true,
  'Equivalence.mapInput': true,
  'Filter.zipWith': true,
  'Function.dual': true,
  'Function.flip': true,
  'Function.flow': true,
  'Function.tupled': true,
  'Graph.complement': true,
  'Graph.findEdge': true,
  'Graph.findEdges': true,
  'Layer.fromBuild': true,
  'Layer.fromBuildMemo': true,
  'Metric.mapInput': true,
  'Newtype.makeEquivalence': true,
  'Newtype.makeOrder': true,
  'Optic.makeLens': true,
  'Optic.makeOptional': true,
  'Option.containsWith': true,
  'Option.lift2': true,
  'Option.liftNullishOr': true,
  'Option.liftThrowable': true,
  'Option.makeEquivalence': true,
  'Option.makeOrder': true,
  'Option.reduceCompact': true,
  'Option.zipWith': true,
  'Order.Array': true,
  'Order.clamp': true,
  'Order.combine': true,
  'Order.flip': true,
  'Order.isBetween': true,
  'Order.isGreaterThan': true,
  'Order.isGreaterThanOrEqualTo': true,
  'Order.isLessThan': true,
  'Order.isLessThanOrEqualTo': true,
  'Order.make': true,
  'Order.mapInput': true,
  'Order.max': true,
  'Order.min': true,
  'Redacted.makeEquivalence': true,
  'Reducer.make': true,
  'RequestResolver.around': true,
  'RequestResolver.make': true,
  'Result.makeEquivalence': true,
  'Schema.makeFilter': true,
  'Schema.middlewareDecoding': true,
  'Schema.middlewareEncoding': true,
  'SchemaGetter.checkEffect': true,
  'SchemaGetter.fail': true,
  'SchemaGetter.transformEffect': true,
  'SchemaGetter.transformOptionalEffect': true,
  'Sink.fold': true,
  'Sink.foldArray': true,
  'Sink.foldUntil': true,
  'Sink.fromTransform': true,
  'Sink.reduce': true,
  'Sink.reduceArray': true,
  'Sink.reduceEffect': true,
  'Sink.reduceWhile': true,
  'Sink.reduceWhileArray': true,
  'Sink.reduceWhileArrayEffect': true,
  'Sink.reduceWhileEffect': true,
  'Sink.summarized': true,
  'Stream.catchCauseFilter': true,
  'Stream.catchReason': true,
  'Stream.catchReasons': true,
  'Stream.changesWith': true,
  'Stream.changesWithEffect': true,
  'Stream.combine': true,
  'Stream.combineArray': true,
  'Stream.crossWith': true,
  'Stream.dropUntil': true,
  'Stream.dropUntilEffect': true,
  'Stream.dropWhile': true,
  'Stream.dropWhileEffect': true,
  'Stream.filterEffect': true,
  'Stream.map': true,
  'Stream.mapAccum': true,
  'Stream.mapAccumArray': true,
  'Stream.mapAccumArrayEffect': true,
  'Stream.mapAccumEffect': true,
  'Stream.mapArray': true,
  'Stream.mapArrayEffect': true,
  'Stream.mapEffect': true,
  'Stream.runFold': true,
  'Stream.runFoldEffect': true,
  'Stream.scan': true,
  'Stream.scanEffect': true,
  'Stream.takeUntil': true,
  'Stream.takeUntilEffect': true,
  'Stream.takeWhile': true,
  'Stream.takeWhileEffect': true,
  'Stream.transformPull': true,
  'Stream.transformPullBracket': true,
  'Stream.zipLatestWith': true,
  'Stream.zipWith': true,
  'Stream.zipWithArray': true,
  'TextDiff.diffWith': true,
  'TxHashSet.reduce': true,
  'TxPriorityQueue.empty': true,
  'TxPriorityQueue.fromIterable': true,
  'TxPriorityQueue.make': true,
  'UndefinedOr.liftThrowable': true,
  'Unify.unify': true,
} satisfies Record<
  Exclude<MultiArgumentApi, `${(typeof indexedModules)[number] | (typeof contextualModules)[number]}.${string}`>,
  true
>;

const isMultiArgumentApi = Schema.is(Schema.Literals(Struct.keys(multiArgumentApis)));

/**
 * The Effect API call that receives a callback and passes it one argument, such as `Effect.map(…)`, so a function with
 * one parameter can replace the callback as is.
 *
 * @param node Callback.
 * @param imports Import bindings of the file.
 */
export function unaryEffectCallback(node: FunctionNode, imports: ImportBindings): Opt.Option<ESTree.CallExpression> {
  return Opt.filter(callbackCall(node), (parent) =>
    Opt.exists(
      imports.path(parent.callee),
      (path) =>
        path.length === 2 &&
        !Opt.exists(Arr.head(path), (module) => isIndexedModule(module) || isContextualModule(module)) &&
        !isMultiArgumentApi(Arr.join(path, '.')),
    ),
  );
}

// Annotations on the callback can type it differently from the callee's own signature.
export function isAnnotated(node: FunctionNode): boolean {
  return (
    Boolean(node.returnType) ||
    Arr.some(node.params, (parameter) => parameter.type === 'Identifier' && Boolean(parameter.typeAnnotation))
  );
}

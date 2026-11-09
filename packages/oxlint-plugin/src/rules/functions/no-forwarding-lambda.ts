import {
  Diagnostic,
  RuleContext,
  Visitor,
  type CreateRule,
  type Definition,
  type ESTree,
  type OxlintSourceCode,
} from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';
import * as Tuple from 'effect/Tuple';

import { callbackCall, containsRange, isConstDeclaration, isFunctionNode, type FunctionNode } from '../../internal/ast';
import { argumentText } from '../../internal/fixes';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';
import { lookupVariable } from '../../internal/scope';
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
function isSettledCallee(
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

/**
 * Whether a callee is a function of this file with exactly one signature: a function declaration without overloads, or
 * an unannotated `const` holding a function expression. TypeScript infers a callback type from the last overload, so an
 * overloaded callee, such as an Effect dual API, can stop type-checking once passed directly.
 *
 * @param sourceCode Source of the file.
 * @param callee Forwarded callee.
 */
function isLocalSingleSignature(sourceCode: OxlintSourceCode, callee: ESTree.Expression | ESTree.Super): boolean {
  if (callee.type !== 'Identifier') {
    return false;
  }

  return Opt.exists(lookupVariable(sourceCode, callee, callee.name), ({ defs }) => {
    const [definition] = defs;

    if (!definition || defs.length !== 1) {
      return false;
    }

    if (definition.type === 'FunctionName') {
      return definition.node.type === 'FunctionDeclaration';
    }

    const declarator = definition.node;

    return (
      definition.type === 'Variable' &&
      declarator.type === 'VariableDeclarator' &&
      declarator.id.type === 'Identifier' &&
      !declarator.id.typeAnnotation &&
      P.isNotNull(declarator.init) &&
      isFunctionNode(declarator.init)
    );
  });
}

// Annotations on the callback can type it differently from the callee's own signature.
function isAnnotated(node: FunctionNode): boolean {
  return (
    Boolean(node.returnType) ||
    Arr.some(node.params, (parameter) => parameter.type === 'Identifier' && Boolean(parameter.typeAnnotation))
  );
}

/**
 * Report callbacks of Effect APIs that only pass their parameters on, such as `Effect.map((value) => f(value))`.
 */
export const noForwardingLambda: CreateRule = defineRule({
  name: 'no-forwarding-lambda',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Disallow Effect callbacks that only forward their parameters to another function.',
    messages: {
      forwardingLambda: 'This callback only passes its parameters to {{callee}}. Pass {{callee}} directly.',
      passCallee: 'Pass {{callee}} directly.',
    },
    fixable: 'code',
    hasSuggestions: true,
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    const { sourceCode } = ctx;

    const report = Effect.fnUntraced(function* (node: FunctionNode, call: ESTree.CallExpression) {
      const text = sourceCode.getText(call.callee);

      const callee = Str.includes('\n')(text) ? 'the callee' : `\`${text}\``;

      const diagnostic = Diagnostic.fromId({ node, messageId: 'forwardingLambda', data: { callee } });

      if (
        Arr.isReadonlyArrayNonEmpty(sourceCode.getCommentsInside(node)) ||
        !isSettledCallee(sourceCode, call.callee, node)
      ) {
        return yield* ctx.report(diagnostic);
      }

      const fix = Diagnostic.replaceText(node, argumentText(sourceCode, call.callee));

      return yield* ctx.report(
        isLocalSingleSignature(sourceCode, call.callee) && !isAnnotated(node)
          ? Diagnostic.withFix(diagnostic, fix)
          : Diagnostic.withSuggestions(diagnostic, [{ messageId: 'passCallee', data: { callee }, fix }]),
      );
    });

    function check(node: FunctionNode) {
      return Opt.match(replaceableForwarding(node, imports), {
        onNone: () => Effect.void,
        onSome: ({ call }) => report(node, call),
      });
    }

    return Visitor.merge(Visitor.on('ArrowFunctionExpression', check), Visitor.on('FunctionExpression', check));
  },
});

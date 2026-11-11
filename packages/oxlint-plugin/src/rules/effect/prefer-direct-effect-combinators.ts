/* eslint-disable sonar/no-duplicate-string -- The pattern tables name the APIs each pattern matches, like the test tables. */
import type * as EffectBarrel from 'effect';
import {
  Diagnostic,
  Rule,
  RuleContext,
  Visitor,
  type ESTree,
  type FixFn,
  type OxlintSourceCode,
  type Range,
} from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import type * as Filter from 'effect/Filter';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';
import type * as Result from 'effect/Result';
import * as Str from 'effect/String';
import * as Struct from 'effect/Struct';
import * as Tuple from 'effect/Tuple';

import {
  containsIdentifier,
  containsRange,
  isFunctionNode,
  isLiteral,
  plainProperty,
  propertyName,
  staticPath,
  staticPropertyName,
  walkNodes,
  type FunctionNode,
} from '../../internal/ast';
import { argumentText, namespaceImport } from '../../internal/fixes';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isGlobalIn } from '../../internal/scope';
import { isDetachableCallee, isEffectGuard, isSettledCallee } from '../functions/internal/forwarding';
import { functionResult } from './internal/callbacks';
import { namespaceAlias } from './internal/import-style';

type DataModule = 'Array' | 'Filter' | 'Option' | 'Result';

/**
 * An API of a data module, such as `Option.filter`, named by module and member whatever the file's import aliases.
 */
type Api =
  | `Array.${Extract<keyof typeof Arr, string>}`
  | `Filter.${Extract<keyof typeof Filter, string>}`
  | `Option.${Extract<keyof typeof Opt, string>}`
  | `Result.${Extract<keyof typeof Result, string>}`;

/**
 * The data-first arity of each API a pattern starts from: `Option.filter(self, predicate)` takes 2, so
 * `Option.filter(predicate)` is its data-last form and `Option.isSome` is a data-last step on its own.
 */
const arities: Readonly<Partial<Record<Api, 1 | 2>>> = {
  'Array.filter': 2,
  'Array.findFirst': 2,
  'Array.findFirstIndex': 2,
  'Array.flatMap': 2,
  'Array.flatten': 1,
  'Array.head': 1,
  'Array.isArrayEmpty': 1,
  'Array.isArrayNonEmpty': 1,
  'Array.isReadonlyArrayEmpty': 1,
  'Array.isReadonlyArrayNonEmpty': 1,
  'Array.last': 1,
  'Array.length': 1,
  'Array.map': 2,
  'Array.reverse': 1,
  'Option.filter': 2,
  'Option.flatMap': 2,
  'Option.flatten': 1,
  'Option.getFailure': 1,
  'Option.getOrElse': 2,
  'Option.getOrNull': 1,
  'Option.getOrUndefined': 1,
  'Option.getSuccess': 1,
  'Option.isNone': 1,
  'Option.isSome': 1,
  'Option.map': 2,
  'Option.match': 2,
  'Option.orElse': 2,
  'Option.some': 1,
  'Result.flatMap': 2,
  'Result.getFailure': 1,
  'Result.getOrElse': 2,
  'Result.getSuccess': 1,
  'Result.isFailure': 1,
  'Result.isSuccess': 1,
  'Result.map': 2,
  'Result.mapError': 2,
};

/**
 * One call in a chain: `Option.filter(self, p)` data-first, or `Option.filter(p)` and `Option.isSome` as a data-last
 * pipe step. `args` leaves out `self`.
 */
interface Step {
  readonly api: string;
  readonly node: ESTree.Expression;
  readonly callee: ESTree.Node;
  readonly args: ReadonlyArray<ESTree.Expression>;
}

/**
 * How safely a rewrite applies: `fix` keeps the behavior, `boolean` is a suggestion because it only holds for a
 * callback that returns a boolean, `pure` is a suggestion because the direct API stops at the first match, so the
 * callback runs fewer times, `array` is a suggestion because the direct API needs an array where the original takes any
 * iterable, and `none` is reported without a fix.
 */
type Safety = 'array' | 'boolean' | 'fix' | 'none' | 'pure';

interface Rewrite {
  readonly api: Api;
  readonly args: ReadonlyArray<string>;
  readonly negate: boolean;
  readonly safety: Safety;
}

interface Pair {
  readonly inner: Step;
  readonly outer: Step;
  /**
   * The value the inner step receives, when it is in the source: its `self`, the pipe subject or the previous step.
   */
  readonly input: Opt.Option<ESTree.Node>;
  /**
   * Whether the outer call is data-first, so its arguments evaluate after the inner call has run its callback.
   */
  readonly nested: boolean;
}

interface Tools {
  readonly imports: ImportBindings;
  readonly sourceCode: OxlintSourceCode;
}

type PairRewrite = (pair: Pair, tools: Tools) => Opt.Option<Rewrite>;

interface PairPattern {
  readonly inner: ReadonlyArray<Api>;
  readonly outer: ReadonlyArray<Api>;
  readonly rewrite: PairRewrite;
}

/**
 * A step whose callback goes through another API, rewritten to `api` with `argument` as its new callback, or without
 * one.
 */
interface CallbackRewrite {
  readonly api: Api;
  readonly callback: string;
  readonly argument: Opt.Option<string>;
}

interface CallbackPattern {
  readonly apis: ReadonlyArray<Api>;
  readonly rewrite: (callback: ESTree.Expression, tools: Tools) => Opt.Option<CallbackRewrite>;
}

function apiOf(node: ESTree.Node, imports: ImportBindings): Opt.Option<readonly [string, 1 | 2]> {
  return imports.path(node).pipe(
    Opt.filter((path) => path.length === 2),
    Opt.flatMap((path) => {
      const api = Arr.join(path, '.');

      return Opt.map(R.get(arities as Readonly<Record<string, 1 | 2>>, api), (arity) => Tuple.make(api, arity));
    }),
  );
}

function isApiReference(node: ESTree.Node, api: Api, imports: ImportBindings): boolean {
  return (
    (node.type === 'Identifier' || node.type === 'MemberExpression') &&
    Opt.exists(imports.path(node), (path) => Arr.join(path, '.') === api)
  );
}

// The arguments of a call a rewrite can rebuild: no spread, optional call or type arguments it would drop.
function plainArguments(node: ESTree.CallExpression): Opt.Option<ReadonlyArray<ESTree.Expression>> {
  return node.optional ||
    P.isNotNullish(node.typeArguments) ||
    Arr.some(node.arguments, (argument) => argument.type === 'SpreadElement')
    ? Opt.none()
    : Opt.some(node.arguments as ReadonlyArray<ESTree.Expression>);
}

/**
 * A data-first call, such as `Option.filter(self, p)`, with its `self`.
 *
 * @param node Expression.
 * @param imports Import bindings of the file.
 */
function dataFirstCall(
  node: ESTree.Node,
  imports: ImportBindings,
): Opt.Option<{ readonly step: Step; readonly self: ESTree.Expression }> {
  if (node.type !== 'CallExpression') {
    return Opt.none();
  }

  return Opt.product(apiOf(node.callee, imports), plainArguments(node)).pipe(
    Opt.flatMap(([[api, arity], args]) =>
      args.length === arity
        ? Opt.map(Arr.head(args), (self) => ({
            self,
            step: { api, node, callee: node.callee, args: Arr.drop(args, 1) },
          }))
        : Opt.none(),
    ),
  );
}

/**
 * A data-last step, such as `Option.filter(p)` or `Option.isSome`.
 *
 * @param node Expression.
 * @param imports Import bindings of the file.
 */
function dataLastStep(node: ESTree.Expression, imports: ImportBindings): Opt.Option<Step> {
  if (node.type === 'CallExpression') {
    return Opt.product(apiOf(node.callee, imports), plainArguments(node)).pipe(
      Opt.flatMap(([[api, arity], args]) =>
        args.length + 1 === arity ? Opt.some({ api, node, callee: node.callee, args }) : Opt.none(),
      ),
    );
  }

  return node.type === 'Identifier' || node.type === 'MemberExpression'
    ? Opt.flatMap(apiOf(node, imports), ([api, arity]) =>
        arity === 1 ? Opt.some({ api, node, callee: node, args: [] }) : Opt.none(),
      )
    : Opt.none();
}

/**
 * The steps of `self.pipe(...)`, `pipe(self, ...)` or `flow(...)`; `flow` has no `self`.
 */
interface Sequence {
  readonly kind: 'flow' | 'pipe';
  readonly call: ESTree.CallExpression;
  readonly subject: Opt.Option<ESTree.Expression>;
  readonly steps: ReadonlyArray<ESTree.Expression>;
}

function sequenceOf(node: ESTree.Node, imports: ImportBindings): Opt.Option<Sequence> {
  if (node.type !== 'CallExpression') {
    return Opt.none();
  }

  const callee = node.callee;

  return Opt.flatMap(plainArguments(node), (args): Opt.Option<Sequence> => {
    if (
      callee.type === 'MemberExpression' &&
      callee.object.type !== 'Super' &&
      Opt.contains(staticPropertyName(callee), 'pipe')
    ) {
      return Opt.some({ kind: 'pipe', call: node, subject: Opt.some(callee.object), steps: args });
    }

    if (
      imports.isApi(callee, 'Function', 'pipe' satisfies keyof typeof Fn) ||
      imports.isApiPath(callee, ['pipe' satisfies keyof typeof EffectBarrel])
    ) {
      return Opt.some({ kind: 'pipe', call: node, subject: Arr.head(args), steps: Arr.drop(args, 1) });
    }

    return imports.isApi(callee, 'Function', 'flow' satisfies keyof typeof Fn) ||
      imports.isApiPath(callee, ['flow' satisfies keyof typeof EffectBarrel])
      ? Opt.some({ kind: 'flow', call: node, subject: Opt.none(), steps: args })
      : Opt.none();
  });
}

function texts(tools: Tools, nodes: ReadonlyArray<ESTree.Expression>): ReadonlyArray<string> {
  return Arr.map(nodes, (node) => argumentText(tools.sourceCode, node));
}

function to(
  api: Api,
  options: {
    readonly negate?: boolean;
    readonly safety?: (pair: Pair, tools: Tools) => Safety;
    readonly args?: (pair: Pair, tools: Tools) => ReadonlyArray<string>;
  } = {},
): PairRewrite {
  return (pair, tools) =>
    Opt.some({
      api,
      negate: options.negate ?? false,
      safety: options.safety?.(pair, tools) ?? 'fix',
      args: options.args?.(pair, tools) ?? texts(tools, [...pair.inner.args, ...pair.outer.args]),
    });
}

/**
 * A handler object for `match` or `mapBoth` from the inner callback and the outer one, in source order so their
 * expressions still evaluate in the same order.
 *
 * @param innerKey Key of the inner step's callback.
 * @param outerKey Key of the outer step's callback.
 */
function handlers(innerKey: string, outerKey: string): (pair: Pair, tools: Tools) => ReadonlyArray<string> {
  return ({ inner, outer }, tools) => {
    const [innerCallback = '', outerCallback = ''] = texts(tools, [...inner.args, ...outer.args]);

    return [`{ ${innerKey}: ${innerCallback}, ${outerKey}: ${outerCallback} }`];
  };
}

function firstArgument(step: Step): Opt.Option<ESTree.Expression> {
  return Arr.head(step.args);
}

function isThunk(node: ESTree.Node): node is ESTree.ArrowFunctionExpression {
  return node.type === 'ArrowFunctionExpression' && !node.async && Arr.isReadonlyArrayEmpty(node.params);
}

// `() => false`.
function isFalseThunk(node: ESTree.Node): boolean {
  return isThunk(node) && node.expression && isLiteral(node.body, false);
}

function rootCallee(node: ESTree.Node): ESTree.Node {
  return node.type === 'CallExpression' ? rootCallee(node.callee) : node;
}

const booleanMembers: ReadonlySet<string> = new Set([
  'contains',
  'endsWith',
  'every',
  'exists',
  'has',
  'includes',
  'is',
  'some',
  'startsWith',
]);

const comparisonOperators: ReadonlySet<string> = new Set([
  '!=',
  '!==',
  '<',
  '<=',
  '==',
  '===',
  '>',
  '>=',
  'in',
  'instanceof',
]);

/**
 * Whether an expression evaluates to a boolean: a comparison, a negation, a boolean literal, a combination of those, or
 * a call of an Effect guard such as `P.isString(x)` or `Str.startsWith('a')(x)`.
 *
 * @param node Expression.
 * @param imports Import bindings of the file.
 */
function returnsBoolean(node: ESTree.Node, imports: ImportBindings): boolean {
  return Match.value(node).pipe(
    Match.discriminators('type')({
      BinaryExpression: ({ operator }) => comparisonOperators.has(operator),
      UnaryExpression: ({ operator }) => operator === '!',
      Literal: ({ value }) => P.isBoolean(value),
      LogicalExpression: ({ operator, left, right }) =>
        operator !== '??' && returnsBoolean(left, imports) && returnsBoolean(right, imports),
      ConditionalExpression: ({ consequent, alternate }) =>
        returnsBoolean(consequent, imports) && returnsBoolean(alternate, imports),
      CallExpression: (call) =>
        imports.path(rootCallee(call)).pipe(
          Opt.flatMap((path) => Arr.get(path, 1)),
          Opt.exists((member) => booleanMembers.has(member) || /^is\p{Lu}/u.test(member)),
        ),
    }),
    Match.orElse(Fn.constFalse),
  );
}

function returnsOption(node: ESTree.Node, imports: ImportBindings): boolean {
  if (node.type === 'ConditionalExpression') {
    return returnsOption(node.consequent, imports) || returnsOption(node.alternate, imports);
  }

  return (
    node.type === 'CallExpression' &&
    !returnsBoolean(node, imports) &&
    Opt.exists(imports.path(rootCallee(node)), (path) => Opt.contains(Arr.head(path), 'Option'))
  );
}

function callbackResult(node: ESTree.Node): Opt.Option<ESTree.Expression> {
  return isFunctionNode(node) && !node.async && !node.generator ? functionResult(node) : Opt.none();
}

/**
 * The safety of `Arr.findFirst` → `Arr.some`. `Arr.findFirst` also takes a callback that returns an Option, which
 * `Arr.some` would treat as always matching, so only a callback known to return a boolean is fixed.
 *
 * @param pair Steps.
 * @param tools Rule tools.
 */
function booleanCallbackSafety(pair: Pair, tools: Tools): Safety {
  return Opt.exists(firstArgument(pair.inner), (callback) => isBooleanCallback(callback, tools.imports))
    ? 'fix'
    : 'boolean';
}

// An Effect guard such as `P.isString`, or a function whose result is visibly a boolean.
function isBooleanCallback(node: ESTree.Expression, imports: ImportBindings): boolean {
  return isEffectGuard(node, imports) || Opt.exists(callbackResult(node), (result) => returnsBoolean(result, imports));
}

const arrayApis: ReadonlySet<string> = new Set([
  'append',
  'appendAll',
  'dedupe',
  'drop',
  'empty',
  'filter',
  'filterMap',
  'flatMap',
  'flatMapNullishOr',
  'flatten',
  'fromIterable',
  'getFailures',
  'getSomes',
  'getSuccesses',
  'make',
  'map',
  'of',
  'prepend',
  'prependAll',
  'range',
  'replicate',
  'reverse',
  'sort',
  'sortBy',
  'sortWith',
  'take',
]);

/**
 * Whether an expression visibly evaluates to an array: an array literal, or an Effect Array call or step that returns
 * one, such as `Arr.map(xs, f)` or `Arr.filter(p)` in a pipe.
 *
 * @param node Expression or pipe step.
 * @param imports Import bindings of the file.
 */
function isArrayValued(node: ESTree.Node, imports: ImportBindings): boolean {
  return (
    node.type === 'ArrayExpression' ||
    imports.isApi(node.type === 'CallExpression' ? node.callee : node, 'Array', [...arrayApis])
  );
}

/**
 * Downgrade a fix to a suggestion unless the inner step visibly receives an array. `Arr.some` and `Arr.last` take an
 * array, while `Arr.findFirst`, `Arr.findFirstIndex` and `Arr.reverse` take any iterable, such as a `Set`.
 *
 * @param rewrite Rewrite to guard.
 */
function forArrays(rewrite: PairRewrite): PairRewrite {
  return (pair, tools) =>
    Opt.map(rewrite(pair, tools), (found) =>
      found.safety === 'fix' && !Opt.exists(pair.input, (input) => isArrayValued(input, tools.imports))
        ? Struct.assign(found, { safety: 'array' as const })
        : found,
    );
}

/**
 * Whether a callback receives only its first argument: no second or rest parameter, and no `arguments`.
 *
 * @param node Callback.
 */
function takesOneArgument(node: ESTree.Node): boolean {
  return (
    isFunctionNode(node) &&
    node.params.length <= 1 &&
    Arr.every(node.params, (parameter) => parameter.type !== 'RestElement') &&
    (node.type === 'ArrowFunctionExpression' || !containsIdentifier(node, 'arguments'))
  );
}

// An argument whose evaluation has no effects, so evaluating it earlier changes nothing.
function isInert(node: ESTree.Node): boolean {
  return (
    isFunctionNode(node) ||
    node.type === 'Literal' ||
    (node.type === 'TemplateLiteral' && Arr.isReadonlyArrayEmpty(node.expressions)) ||
    Opt.isSome(staticPath(node))
  );
}

// Skip `Arr.findFirst` with a callback that returns an Option, which `Arr.some` cannot express.
function unlessOptionCallback(rewrite: PairRewrite): PairRewrite {
  return (pair, tools) =>
    firstArgument(pair.inner).pipe(
      Opt.flatMap(callbackResult),
      Opt.exists((result) => returnsOption(result, tools.imports)),
    )
      ? Opt.none()
      : rewrite(pair, tools);
}

// `(value) => value.field`.
function isFieldAccessor(node: ESTree.Node, field: string): boolean {
  if (node.type !== 'ArrowFunctionExpression' || node.async || !node.expression || node.params.length !== 1) {
    return false;
  }

  const [parameter] = node.params;

  const body = node.body;

  return (
    parameter?.type === 'Identifier' &&
    body.type === 'MemberExpression' &&
    !body.optional &&
    body.object.type === 'Identifier' &&
    body.object.name === parameter.name &&
    Opt.contains(staticPropertyName(body), field)
  );
}

const unwrappers: ReadonlyArray<{
  readonly guard: Api;
  readonly field: string;
  readonly getter: Opt.Option<Api>;
  readonly api: Api;
}> = [
  { guard: 'Option.isSome', field: 'value', getter: Opt.some('Option.getOrThrow'), api: 'Array.getSomes' },
  { guard: 'Result.isSuccess', field: 'success', getter: Opt.some('Result.getOrThrow'), api: 'Array.getSuccesses' },
  { guard: 'Result.isFailure', field: 'failure', getter: Opt.none(), api: 'Array.getFailures' },
];

/**
 * `Arr.filter(xs, Opt.isSome)` followed by `Arr.map((o) => o.value)` is `Arr.getSomes`, and likewise for Result
 * successes and failures.
 *
 * @param pair Steps.
 * @param tools Rule tools.
 */
function filterMapRewrite(pair: Pair, tools: Tools): Opt.Option<Rewrite> {
  return Opt.product(firstArgument(pair.inner), firstArgument(pair.outer)).pipe(
    Opt.flatMap(([guard, mapper]) =>
      Arr.findFirst(
        unwrappers,
        (unwrapper) =>
          isApiReference(guard, unwrapper.guard, tools.imports) &&
          (isFieldAccessor(mapper, unwrapper.field) ||
            Opt.exists(unwrapper.getter, (getter) => isApiReference(mapper, getter, tools.imports))),
      ),
    ),
    Opt.flatMap(({ api }) => to(api, { args: () => [] })(pair, tools)),
  );
}

/**
 * `Arr.map(xs, f)` followed by `Arr.filter(P.isNotNullish)` is `Arr.flatMapNullishOr(xs, f)`. That API passes `f` no
 * index, so only a callback with at most one parameter is fixed.
 *
 * @param pair Steps.
 * @param tools Rule tools.
 */
function nullishMapRewrite(pair: Pair, tools: Tools): Opt.Option<Rewrite> {
  return Opt.exists(firstArgument(pair.outer), (predicate) =>
    Opt.exists(tools.imports.path(predicate), (path) => Arr.join(path, '.') === 'Predicate.isNotNullish'),
  )
    ? to('Array.flatMapNullishOr', {
        args: ({ inner }) => texts(tools, inner.args),
        safety: ({ inner }) => (Opt.exists(firstArgument(inner), takesOneArgument) ? 'fix' : 'none'),
      })(pair, tools)
    : Opt.none();
}

const getSuccess: ReadonlyArray<Api> = ['Option.getSuccess', 'Result.getSuccess'];

const getFailure: ReadonlyArray<Api> = ['Option.getFailure', 'Result.getFailure'];

/**
 * Two steps in a row that one API expresses, tried in order.
 */
const pairPatterns: ReadonlyArray<PairPattern> = [
  { inner: ['Option.some'], outer: ['Option.filter'], rewrite: to('Option.liftPredicate') },
  { inner: ['Option.filter'], outer: ['Option.isSome'], rewrite: to('Option.exists') },
  { inner: ['Option.filter'], outer: ['Option.isNone'], rewrite: to('Option.exists', { negate: true }) },
  { inner: ['Option.map'], outer: ['Option.flatten'], rewrite: to('Option.flatMap') },
  {
    inner: ['Option.map'],
    outer: ['Option.getOrElse'],
    // `Opt.exists` needs a predicate, so `() => false` only makes it `exists` when the mapper returns a boolean.
    rewrite: (pair, tools) =>
      Opt.exists(firstArgument(pair.outer), isFalseThunk) &&
      Opt.exists(firstArgument(pair.inner), (mapper) => isBooleanCallback(mapper, tools.imports))
        ? to('Option.exists', { args: ({ inner }) => texts(tools, inner.args) })(pair, tools)
        : to('Option.match', { args: handlers('onSome', 'onNone') })(pair, tools),
  },
  { inner: getSuccess, outer: ['Option.isSome'], rewrite: to('Result.isSuccess') },
  { inner: getSuccess, outer: ['Option.isNone'], rewrite: to('Result.isFailure') },
  { inner: getFailure, outer: ['Option.isSome'], rewrite: to('Result.isFailure') },
  { inner: getFailure, outer: ['Option.isNone'], rewrite: to('Result.isSuccess') },
  { inner: getSuccess, outer: ['Option.getOrNull'], rewrite: to('Result.getOrNull') },
  { inner: getSuccess, outer: ['Option.getOrUndefined'], rewrite: to('Result.getOrUndefined') },
  {
    inner: getSuccess,
    outer: ['Option.getOrElse'],
    // `Result.getOrElse` passes the failure to its callback, which a thunk ignores.
    rewrite: to('Result.getOrElse', {
      safety: ({ outer }) => (Opt.exists(firstArgument(outer), isThunk) ? 'fix' : 'none'),
    }),
  },
  {
    inner: ['Array.findFirst'],
    outer: ['Option.isSome'],
    rewrite: unlessOptionCallback(forArrays(to('Array.some', { safety: booleanCallbackSafety }))),
  },
  {
    inner: ['Array.findFirst'],
    outer: ['Option.isNone'],
    rewrite: unlessOptionCallback(forArrays(to('Array.some', { negate: true, safety: booleanCallbackSafety }))),
  },
  { inner: ['Array.findFirstIndex'], outer: ['Option.isSome'], rewrite: forArrays(to('Array.some')) },
  {
    inner: ['Array.findFirstIndex'],
    outer: ['Option.isNone'],
    rewrite: forArrays(to('Array.some', { negate: true })),
  },
  { inner: ['Array.filter'], outer: ['Array.head'], rewrite: to('Array.findFirst', { safety: () => 'pure' }) },
  {
    inner: ['Array.filter'],
    outer: ['Array.isArrayNonEmpty', 'Array.isReadonlyArrayNonEmpty'],
    rewrite: to('Array.some', { safety: () => 'pure' }),
  },
  {
    inner: ['Array.filter'],
    outer: ['Array.isArrayEmpty', 'Array.isReadonlyArrayEmpty'],
    rewrite: to('Array.some', { negate: true, safety: () => 'pure' }),
  },
  { inner: ['Array.filter'], outer: ['Array.length'], rewrite: to('Array.countBy') },
  { inner: ['Array.filter'], outer: ['Array.map'], rewrite: filterMapRewrite },
  { inner: ['Array.map'], outer: ['Array.filter'], rewrite: nullishMapRewrite },
  { inner: ['Array.map'], outer: ['Array.flatten'], rewrite: to('Array.flatMap') },
  { inner: ['Array.head', 'Array.last'], outer: ['Option.isSome'], rewrite: to('Array.isReadonlyArrayNonEmpty') },
  { inner: ['Array.head', 'Array.last'], outer: ['Option.isNone'], rewrite: to('Array.isReadonlyArrayEmpty') },
  { inner: ['Array.reverse'], outer: ['Array.head'], rewrite: forArrays(to('Array.last')) },
  {
    inner: ['Result.map'],
    outer: ['Result.getOrElse'],
    rewrite: to('Result.match', { args: handlers('onSuccess', 'onFailure') }),
  },
  {
    inner: ['Result.map'],
    outer: ['Result.mapError'],
    rewrite: to('Result.mapBoth', { args: handlers('onSuccess', 'onFailure') }),
  },
  {
    inner: ['Result.mapError'],
    outer: ['Result.map'],
    rewrite: to('Result.mapBoth', { args: handlers('onFailure', 'onSuccess') }),
  },
];

/**
 * The first pattern's rewrite of two steps. In a nested call such as `Opt.getOrElse(Opt.map(o, f), g)`, `f` runs before
 * `g` is evaluated, while the fused call evaluates `g` first, so it is only fixed when the outer arguments have no
 * effects.
 *
 * @param pair Steps.
 * @param tools Rule tools.
 */
function pairRewrite(pair: Pair, tools: Tools): Opt.Option<Rewrite> {
  const reordered = pair.nested && Arr.isReadonlyArrayNonEmpty(pair.inner.args) && !Arr.every(pair.outer.args, isInert);

  return Arr.findFirst(pairPatterns, (pattern) =>
    Arr.contains(pattern.inner, pair.inner.api) && Arr.contains(pattern.outer, pair.outer.api)
      ? pattern.rewrite(pair, tools)
      : Opt.none(),
  ).pipe(Opt.map((rewrite) => (reordered ? Struct.assign(rewrite, { safety: 'none' as const }) : rewrite)));
}

/**
 * The call a callback returns as its whole body, without type assertions a rewrite would have to keep.
 *
 * @param node Callback.
 */
function returnedCall(node: ESTree.Node): Opt.Option<ESTree.CallExpression> {
  if (!isFunctionNode(node) || node.async || node.generator || P.isNullish(node.body)) {
    return Opt.none();
  }

  const body = node.body;

  const returned =
    body.type === 'BlockStatement'
      ? Arr.head(body.body).pipe(
          Opt.filter(
            (statement): statement is ESTree.ReturnStatement =>
              body.body.length === 1 && statement.type === 'ReturnStatement',
          ),
          Opt.flatMapNullishOr((statement) => statement.argument),
        )
      : Opt.some(body);

  return Opt.filter(
    returned,
    (expression): expression is ESTree.CallExpression => expression.type === 'CallExpression',
  );
}

/**
 * A callback that returns `wrapper(value)` rewritten to return `value`, for an API that applies `wrapper` itself:
 * `Opt.flatMap((x) => Opt.some(f(x)))` is `Opt.map((x) => f(x))`.
 *
 * @param wrapper API the callback returns.
 * @param api API that applies `wrapper`.
 * @param oneArgument Whether the new API passes its callback only the value, and no index.
 */
function unwrapReturned(wrapper: Api, api: Api, oneArgument = false): CallbackPattern['rewrite'] {
  return (callback, { imports, sourceCode }) =>
    returnedCall(callback).pipe(
      Opt.filter(
        (call) =>
          isFunctionNode(callback) &&
          // A return type annotation would no longer match the unwrapped value.
          P.isNullish(callback.returnType) &&
          (!oneArgument || takesOneArgument(callback)) &&
          apiIs(call, wrapper, imports),
      ),
      Opt.flatMap((call) =>
        plainArguments(call).pipe(
          Opt.filter((args) => args.length === 1),
          Opt.flatMap(Arr.head),
          Opt.map((value) => {
            const text = argumentText(sourceCode, value);

            const replacement =
              value.type === 'ObjectExpression' && callback.type === 'ArrowFunctionExpression' && callback.body === call
                ? `(${text})`
                : text;

            return {
              api,
              callback: `a callback that returns ${sourceCode.getText(call.callee)}(…)`,
              argument: Opt.some(replaceRange(sourceCode, callback, call.range, replacement)),
            };
          }),
        ),
      ),
    );
}

function apiIs(call: ESTree.CallExpression, api: Api, imports: ImportBindings): boolean {
  return Opt.exists(imports.path(call.callee), (path) => Arr.join(path, '.') === api);
}

function replaceRange(sourceCode: OxlintSourceCode, node: ESTree.Node, range: Range, text: string): string {
  const source = sourceCode.text;

  const [start, end] = node.range;

  return `${Str.slice(start, Tuple.get(range, 0))(source)}${text}${Str.slice(Tuple.get(range, 1), end)(source)}`;
}

/**
 * `() => null` or `constNull` as a fallback, which `getOrNull` expresses, and the same for `undefined`.
 *
 * @param module Module of the `getOrElse` call.
 */
function constantFallback(module: 'Option' | 'Result'): CallbackPattern['rewrite'] {
  return (callback, { imports, sourceCode }) => {
    const body =
      callback.type === 'ArrowFunctionExpression' && !callback.async && callback.expression
        ? Opt.some(callback.body)
        : Opt.none();

    const isNull =
      Opt.exists(body, (expression) => expression.type === 'Literal' && expression.raw === 'null') ||
      imports.isApi(callback, 'Function', 'constNull' satisfies keyof typeof Fn);

    const isUndefined =
      Opt.exists(body, (expression) => isGlobalIn(sourceCode.getScope(expression), expression, 'undefined')) ||
      imports.isApi(callback, 'Function', 'constUndefined' satisfies keyof typeof Fn);

    if (!isNull && !isUndefined) {
      return Opt.none();
    }

    const value = isNull ? 'null' : 'undefined';

    return Opt.some({
      api: isNull ? `${module}.getOrNull` : `${module}.getOrUndefined`,
      callback: `a fallback of ${value}`,
      argument: Opt.none(),
    });
  };
}

// `Opt.match(o, { onNone: () => false, onSome: p })` is `Opt.exists(o, p)`.
function matchExists(callback: ESTree.Expression, { imports, sourceCode }: Tools): Opt.Option<CallbackRewrite> {
  if (callback.type !== 'ObjectExpression' || callback.properties.length !== 2) {
    return Opt.none();
  }

  const properties = Arr.getSomes(Arr.map(callback.properties, plainProperty));

  function handler(name: string) {
    return Arr.findFirst(properties, (property) => Opt.contains(propertyName(property), name) && !property.shorthand);
  }

  return handler('onNone').pipe(
    Opt.filter((onNone) => properties.length === 2 && isFalseThunk(onNone.value)),
    Opt.flatMap(() => handler('onSome')),
    // `Opt.exists` needs a predicate.
    Opt.filter((onSome) => isBooleanCallback(onSome.value, imports)),
    Opt.map((onSome) => ({
      api: 'Option.exists',
      callback: '`onNone: () => false`',
      argument: Opt.some(argumentText(sourceCode, onSome.value)),
    })),
  );
}

// `Opt.flatMap(o, Filter.toOption(f))` is `Opt.filterMap(o, f)`.
function flatMapToOption(callback: ESTree.Expression, { imports, sourceCode }: Tools): Opt.Option<CallbackRewrite> {
  return callback.type === 'CallExpression' && apiIs(callback, 'Filter.toOption', imports)
    ? plainArguments(callback).pipe(
        Opt.filter((args) => args.length === 1),
        Opt.flatMap(Arr.head),
        Opt.map((filter) => ({
          api: 'Option.filterMap',
          callback: `${sourceCode.getText(callback.callee)}(…)`,
          argument: Opt.some(argumentText(sourceCode, filter)),
        })),
      )
    : Opt.none();
}

/**
 * Steps whose callback goes through an API the step can apply itself, tried in order.
 */
const callbackPatterns: ReadonlyArray<CallbackPattern> = [
  { apis: ['Option.flatMap'], rewrite: unwrapReturned('Option.fromNullishOr', 'Option.flatMapNullishOr') },
  { apis: ['Option.flatMap'], rewrite: unwrapReturned('Option.some', 'Option.map') },
  { apis: ['Option.flatMap'], rewrite: flatMapToOption },
  { apis: ['Option.orElse'], rewrite: unwrapReturned('Option.some', 'Option.orElseSome') },
  { apis: ['Option.getOrElse'], rewrite: constantFallback('Option') },
  { apis: ['Option.match'], rewrite: matchExists },
  { apis: ['Result.flatMap'], rewrite: unwrapReturned('Result.succeed', 'Result.map') },
  { apis: ['Result.getOrElse'], rewrite: constantFallback('Result') },
  // `Arr.flatMapNullishOr` passes no index.
  { apis: ['Array.flatMap'], rewrite: unwrapReturned('Array.fromNullishOr', 'Array.flatMapNullishOr', true) },
];

function callbackRewrite(step: Step, tools: Tools): Opt.Option<CallbackRewrite> {
  return Opt.flatMap(firstArgument(step), (callback) =>
    Arr.findFirst(callbackPatterns, (pattern) =>
      Arr.contains(pattern.apis, step.api) ? pattern.rewrite(callback, tools) : Opt.none(),
    ),
  );
}

const filterChecks: Readonly<Record<string, Api>> = {
  'Option.getSuccess': 'Filter.toOption',
  'Result.getSuccess': 'Filter.toOption',
  'Result.isSuccess': 'Filter.toPredicate',
};

/**
 * `(x) => Result.isSuccess(f(x))` or `(x) => f(x).pipe(Result.getSuccess)`: a function that checks the Result of a
 * Filter by hand.
 *
 * @param node Function.
 * @param imports Import bindings of the file.
 */
function filterCheck(
  node: FunctionNode,
  imports: ImportBindings,
): Opt.Option<{ readonly check: Step; readonly filter: ESTree.CallExpression; readonly api: Api }> {
  const [parameter] = node.params;

  if (
    node.async ||
    node.generator ||
    node.typeParameters ||
    node.params.length !== 1 ||
    parameter?.type !== 'Identifier'
  ) {
    return Opt.none();
  }

  const checked = Opt.flatMap(functionResult(node), (result) =>
    dataFirstCall(result, imports).pipe(
      Opt.map(({ step, self }) => Tuple.make(step, self)),
      Opt.orElse(() =>
        sequenceOf(result, imports).pipe(
          Opt.filter(({ kind, steps }) => kind === 'pipe' && steps.length === 1),
          Opt.flatMap(({ subject, steps }) =>
            Arr.head(steps).pipe(
              Opt.flatMap((step) => dataLastStep(step, imports)),
              Opt.product(subject),
            ),
          ),
        ),
      ),
    ),
  );

  return Opt.flatMap(checked, ([check, self]) =>
    Opt.flatMap(R.get(filterChecks, check.api), (api) => {
      const [argument] = self.type === 'CallExpression' ? self.arguments : [];

      return self.type === 'CallExpression' &&
        !self.optional &&
        self.callee.type !== 'Super' &&
        self.arguments.length === 1 &&
        argument?.type === 'Identifier' &&
        argument.name === parameter.name &&
        !walkNodes(
          self.callee,
          (child) => child.type === 'ThisExpression' || (child.type === 'Identifier' && child.name === parameter.name),
        )
        ? Opt.some({ check, filter: self, api })
        : Opt.none();
    }),
  );
}

function isAnnotated(node: FunctionNode): boolean {
  return (
    Boolean(node.returnType) ||
    Arr.some(node.params, (parameter) => parameter.type === 'Identifier' && Boolean(parameter.typeAnnotation))
  );
}

function splitApi(api: Api): readonly [DataModule, string] {
  const [module, member = ''] = Str.split(api, '.');

  return [module as DataModule, member];
}

function callText(name: string, args: ReadonlyArray<string>): string {
  return `${name}(${Arr.join(args, ', ')})`;
}

function stepText(name: string, args: ReadonlyArray<string>): string {
  return Arr.isReadonlyArrayEmpty(args) ? name : callText(name, args);
}

/**
 * Prefix `!`, with parentheses where the negation would otherwise bind to less than the replaced expression.
 *
 * @param text Expression text.
 * @param replaced Node the text replaces.
 */
function negated(text: string, replaced: ESTree.Node): string {
  const parent = replaced.parent as ESTree.Node | null | undefined;

  const needsParentheses =
    (parent?.type === 'MemberExpression' && parent.object === replaced) ||
    ((parent?.type === 'CallExpression' || parent?.type === 'NewExpression') && parent.callee === replaced) ||
    parent?.type === 'TaggedTemplateExpression' ||
    (parent?.type === 'BinaryExpression' && parent.operator === '**' && parent.left === replaced);

  return needsParentheses ? `(!${text})` : `!${text}`;
}

interface Edit {
  readonly range: Range;
  readonly text: string;
}

const pairMessages = {
  array: 'pairIfArray',
  boolean: 'pairIfBoolean',
  fix: 'pair',
  none: 'pair',
  pure: 'pairIfPure',
} as const;

/**
 * Prefer the Effect API that does in one step what a chain of Option, Array, Result or Filter calls does indirectly.
 */
export const preferDirectEffectCombinators = Rule.define({
  name: 'prefer-direct-effect-combinators',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer the direct Effect Option, Array, Result and Filter API over an indirect chain of calls.',
    messages: {
      pair: 'Use {{direct}} instead of {{inner}} followed by {{outer}}.',
      pairIfPure:
        'Use {{direct}} instead of {{inner}} followed by {{outer}}. It stops at the first match, so check that the callback has no side effects or exceptions that relied on running for every element.',
      pairIfBoolean:
        'Use {{direct}} instead of {{inner}} followed by {{outer}} if the callback returns a boolean. {{inner}} also accepts a callback that returns an Option, which {{direct}} would treat as a match.',
      pairIfArray:
        'Use {{direct}} instead of {{inner}} followed by {{outer}} if the input is an array. {{direct}} takes an array, while {{inner}} also takes other iterables, such as a Set.',
      callback: 'Use {{direct}} instead of {{outer}} with {{callback}}.',
      filterCheck:
        'Use {{direct}}({{filter}}) instead of a function that applies {{check}} to the Result of {{filter}}.',
      replace: 'Replace with {{direct}}.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/Option',
    fixable: 'code',
    hasSuggestions: true,
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    const { sourceCode } = ctx;

    const tools: Tools = { imports, sourceCode };

    function text(node: ESTree.Expression) {
      return argumentText(sourceCode, node);
    }

    function hasComments(edits: ReadonlyArray<Edit>) {
      return Arr.some(sourceCode.getAllComments(), (comment) =>
        Arr.some(edits, (edit) => containsRange({ range: edit.range }, comment)),
      );
    }

    /**
     * Report `node`, naming `api` through the file's namespace import of its module, and fix it with `edits` unless
     * `safety` or comments inside the edits rule that out.
     */
    const report = Effect.fnUntraced(function* (options: {
      readonly node: ESTree.Node;
      readonly messageId: string;
      readonly data: Readonly<Record<string, string>>;
      readonly api: Api;
      readonly negate: boolean;
      readonly safety: Safety | 'suggest';
      readonly edits: (name: string) => Opt.Option<ReadonlyArray<Edit>>;
      /**
       * Callees in the reported code, such as `O.filter`, whose namespace the rewrite reuses for its own module.
       */
      readonly callees: ReadonlyArray<ESTree.Node>;
    }) {
      const [module, member] = splitApi(options.api);

      const imported = yield* Opt.match(localNamespace(options.callees, module), {
        onNone: () => namespaceImport(options.node, `effect/${module}`, namespaceAlias(module)),
        onSome: (local) => Effect.succeed({ name: local, fix: Opt.none<FixFn>() }),
      });

      const name = `${imported.name}.${member}`;

      const direct = options.negate ? `!${name}` : name;

      const diagnostic = Diagnostic.fromId({
        node: options.node,
        messageId: options.messageId,
        data: Struct.assign(options.data, { direct }),
      });

      const edits = options.edits(name).pipe(
        Opt.filter((found) => !hasComments(found)),
        Opt.filter(() => options.safety !== 'none'),
      );

      if (Opt.isNone(edits)) {
        return yield* ctx.report(diagnostic);
      }

      const fix = Diagnostic.composeFixes(
        ...Opt.toArray(imported.fix),
        ...Arr.map(edits.value, (edit) => Diagnostic.replaceText({ range: edit.range }, edit.text)),
      );

      return yield* ctx.report(
        options.safety === 'fix'
          ? Diagnostic.withFix(diagnostic, fix)
          : Diagnostic.withSuggestions(diagnostic, [{ messageId: 'replace', data: { direct }, fix }]),
      );
    });

    function localNamespace(callees: ReadonlyArray<ESTree.Node>, module: DataModule) {
      return Arr.findFirst(callees, (callee) =>
        callee.type === 'MemberExpression' &&
        !callee.computed &&
        Opt.exists(imports.path(callee.object), (path) => path.length === 1 && Opt.contains(Arr.head(path), module))
          ? Opt.some(sourceCode.getText(callee.object))
          : Opt.none(),
      );
    }

    function reportPair(
      node: ESTree.Node,
      pair: Pair,
      edits: (rewrite: Rewrite, name: string) => Opt.Option<ReadonlyArray<Edit>>,
    ) {
      return Opt.match(pairRewrite(pair, tools), {
        onNone: () => Effect.void,
        onSome: (rewrite) =>
          report({
            node,
            messageId: pairMessages[rewrite.safety],
            data: {
              inner: sourceCode.getText(pair.inner.callee),
              outer: sourceCode.getText(pair.outer.callee),
            },
            api: rewrite.api,
            negate: rewrite.negate,
            safety: rewrite.safety,
            edits: (name) => edits(rewrite, name),
            callees: [pair.inner.callee, pair.outer.callee],
          }),
      });
    }

    function negatedWhen(rewrite: Rewrite, expression: string, replaced: ESTree.Node) {
      return rewrite.negate ? negated(expression, replaced) : expression;
    }

    // `Opt.isSome(Opt.filter(o, p))`.
    function checkNested(node: ESTree.CallExpression) {
      return dataFirstCall(node, imports).pipe(
        Opt.flatMap((outer) => Opt.map(dataFirstCall(outer.self, imports), (inner) => ({ outer: outer.step, inner }))),
        Opt.match({
          onNone: () => Effect.void,
          onSome: ({ outer, inner }) =>
            reportPair(node, { inner: inner.step, outer, input: Opt.some(inner.self), nested: true }, (rewrite, name) =>
              Opt.some([
                {
                  range: node.range,
                  text: negatedWhen(rewrite, callText(name, [text(inner.self), ...rewrite.args]), node),
                },
              ]),
            ),
        }),
      );
    }

    // `Opt.some(x).pipe(Opt.filter(p))` and `pipe(Opt.some(x), Opt.filter(p), …)`.
    function checkSubject({ call, subject, steps }: Sequence) {
      return subject.pipe(
        Opt.flatMap((value) => dataFirstCall(value, imports)),
        Opt.product(Opt.flatMap(Arr.head(steps), (step) => dataLastStep(step, imports))),
        Opt.match({
          onNone: () => Effect.void,
          onSome: ([inner, outer]) =>
            reportPair(
              outer.node,
              { inner: inner.step, outer, input: Opt.some(inner.self), nested: false },
              (rewrite, name) => {
                const replacement = callText(name, [text(inner.self), ...rewrite.args]);

                if (steps.length === 1) {
                  return Opt.some([{ range: call.range, text: negatedWhen(rewrite, replacement, call) }]);
                }

                return rewrite.negate
                  ? Opt.none()
                  : Opt.product(subject, Arr.get(steps, 1)).pipe(
                      Opt.map(([value, next]) => [
                        { range: value.range, text: replacement },
                        { range: [Tuple.get(outer.node.range, 0), Tuple.get(next.range, 0)], text: '' },
                      ]),
                    );
              },
            ),
        }),
      );
    }

    // `o.pipe(Opt.filter(p), Opt.isSome)`, `pipe(xs, Arr.filter(p), Arr.head)` and `flow(Arr.map(f), Arr.flatten)`.
    function checkSteps(sequence: Sequence) {
      const { kind, call, steps } = sequence;

      const parsed = Arr.map(steps, (step) => dataLastStep(step, imports));

      // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
      return Effect.forEach(
        Arr.zip(Arr.dropRight(parsed, 1), Arr.drop(parsed, 1)),
        ([first, second], index) =>
          Opt.product(first, second).pipe(
            Opt.match({
              onNone: () => Effect.void,
              onSome: ([inner, outer]) =>
                reportPair(
                  outer.node,
                  { inner, outer, input: index === 0 ? sequence.subject : Arr.get(steps, index - 1), nested: false },
                  (rewrite, name) => {
                    const replacement = stepText(name, rewrite.args);

                    const range: Range = [Tuple.get(inner.node.range, 0), Tuple.get(outer.node.range, 1)];

                    if (!rewrite.negate) {
                      return Opt.some([{ range, text: replacement }]);
                    }

                    // A negated result can only wrap the whole pipe, so the step must be its last.
                    return kind === 'pipe' && index + 2 === steps.length
                      ? Opt.some([
                          {
                            range: call.range,
                            text: negated(replaceRange(sourceCode, call, range, replacement), call),
                          },
                        ])
                      : Opt.none();
                  },
                ),
            }),
          ),
        { discard: true },
      );
    }

    // `Opt.flatMap(o, (x) => Opt.fromNullishOr(f(x)))` and its data-last form.
    function checkCallback(node: ESTree.CallExpression) {
      return dataFirstCall(node, imports).pipe(
        Opt.map(({ step, self }) => Tuple.make(step, Opt.some(self))),
        Opt.orElse(() =>
          Opt.map(dataLastStep(node, imports), (step) => Tuple.make(step, Opt.none<ESTree.Expression>())),
        ),
        Opt.flatMap(([step, self]) => Opt.map(callbackRewrite(step, tools), (rewrite) => ({ step, self, rewrite }))),
        Opt.match({
          onNone: () => Effect.void,
          onSome: ({ step, self, rewrite }) =>
            report({
              node,
              messageId: 'callback',
              data: { outer: sourceCode.getText(step.callee), callback: rewrite.callback },
              api: rewrite.api,
              negate: false,
              safety: 'fix',
              edits: (name) => {
                const args = [...self.pipe(Opt.map(text), Opt.toArray), ...Opt.toArray(rewrite.argument)];

                return Opt.some([
                  {
                    range: node.range,
                    text: Opt.match(self, {
                      onNone: () => stepText(name, args),
                      onSome: () => callText(name, args),
                    }),
                  },
                ]);
              },
              callees: [step.callee],
            }),
        }),
      );
    }

    function checkFunction(node: FunctionNode) {
      return Opt.match(filterCheck(node, imports), {
        onNone: () => Effect.void,
        onSome: ({ check, filter, api }) => {
          // Passing the callee drops explicit type arguments, such as `decode<User>(x)`.
          const settled =
            P.isNullish(filter.typeArguments) &&
            isDetachableCallee(filter.callee, imports) &&
            isSettledCallee(sourceCode, filter.callee, node);

          return report({
            node,
            messageId: 'filterCheck',
            data: { check: sourceCode.getText(check.callee), filter: sourceCode.getText(filter.callee) },
            api,
            negate: false,
            safety: settled ? (isAnnotated(node) ? 'suggest' : 'fix') : 'none',
            edits: (name) =>
              Opt.some([
                {
                  range: node.range,
                  text: callText(name, [argumentText(sourceCode, filter.callee as ESTree.Expression)]),
                },
              ]),
            callees: [filter.callee],
          });
        },
      });
    }

    return Visitor.merge(
      Visitor.on('CallExpression', (node) =>
        Effect.andThen(
          Effect.all([checkNested(node), checkCallback(node)], { discard: true }),
          Opt.match(sequenceOf(node, imports), {
            onNone: () => Effect.void,
            onSome: (sequence) => Effect.all([checkSubject(sequence), checkSteps(sequence)], { discard: true }),
          }),
        ),
      ),
      Visitor.on('ArrowFunctionExpression', checkFunction),
      Visitor.on('FunctionExpression', checkFunction),
    );
  },
});

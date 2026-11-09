import { AST, type ESTree, type Ranged } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Equivalence from 'effect/Equivalence';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

export type FunctionNode = ESTree.ArrowFunctionExpression | ESTree.Function;

type WrapperExpression =
  | ESTree.ParenthesizedExpression
  | ESTree.TSAsExpression
  | ESTree.TSNonNullExpression
  | ESTree.TSSatisfiesExpression
  | ESTree.TSTypeAssertion;

/**
 * Expression wrappers that do not change the runtime value: parentheses, type assertions and non-null assertions.
 */
const WrapperExpressionType = Schema.Literals([
  'ParenthesizedExpression',
  'TSAsExpression',
  'TSNonNullExpression',
  'TSSatisfiesExpression',
  'TSTypeAssertion',
] satisfies ReadonlyArray<WrapperExpression['type']>);

export const isWrapperExpressionType = Schema.is(WrapperExpressionType);

const EqualityOperator = Schema.Literals(['==', '===', '!=', '!==']);

export const isEqualityOperator = Schema.is(EqualityOperator);

const FunctionNodeType = Schema.Literals(['ArrowFunctionExpression', 'FunctionExpression']);

const isFunctionNodeType = Schema.is(FunctionNodeType);

export const moduleExportName = Match.type<ESTree.ModuleExportName>().pipe(
  Match.discriminatorsExhaustive('type')({
    Identifier: ({ name }) => name,
    Literal: ({ value }) => value,
  }),
);

/**
 * The static name of a member: `a.name` or `a['name']`.
 *
 * @param node Member expression.
 */
export function staticPropertyName(node: ESTree.MemberExpression): Opt.Option<string> {
  const { computed, property } = node;

  if (!computed && property.type === 'Identifier') {
    return Opt.some(property.name);
  }

  return computed && property.type === 'Literal' && Str.isString(property.value)
    ? Opt.some(property.value)
    : Opt.none();
}

/**
 * The identifier path of a static member chain, such as `['Effect', 'map']` for `Effect.map` or `Effect?.['map']`.
 *
 * @param node Expression.
 */
export function staticPath(node: ESTree.Node): Opt.Option<Arr.NonEmptyReadonlyArray<string>> {
  const target = node.type === 'ChainExpression' ? node.expression : node;

  if (target.type === 'Identifier') {
    return Opt.some(Arr.of(target.name));
  }

  return target.type === 'MemberExpression'
    ? Opt.zipWith(staticPath(target.object), staticPropertyName(target), (path, name) => Arr.append(path, name))
    : Opt.none();
}

/**
 * The static name of an object literal key: `name: …`, `'name': …` or a shorthand property.
 *
 * @param property Object literal property.
 */
export const propertyName = Match.type<ESTree.ObjectProperty>().pipe(
  Match.when({ computed: false, key: { type: 'Identifier' } }, ({ key }) => Opt.some(key.name)),
  Match.when({ key: { type: 'Literal', value: Str.isString } }, ({ key }) => Opt.some(key.value)),
  Match.orElse(() => Opt.none<string>()),
);

/**
 * A `key: value` or shorthand property; spreads, methods, accessors and computed keys are none.
 *
 * @param property Object literal member.
 */
export const plainProperty = Match.type<ESTree.ObjectExpression['properties'][number]>().pipe(
  Match.when({ type: 'Property', computed: false, method: false, kind: 'init' }, Opt.some<ESTree.ObjectProperty>),
  Match.orElse(() => Opt.none<ESTree.ObjectProperty>()),
);

export function objectProperty(node: ESTree.ObjectExpression, name: string): Opt.Option<ESTree.ObjectProperty> {
  return Arr.findFirst(
    node.properties,
    (property): property is ESTree.ObjectProperty =>
      property.type === 'Property' && Opt.contains(propertyName(property), name),
  );
}

/**
 * The argument at `index`, unless it is missing or spread.
 *
 * @param node Call or construction.
 * @param index Argument position.
 */
export function argumentAt(
  node: ESTree.CallExpression | ESTree.NewExpression,
  index: number,
): Opt.Option<ESTree.Expression> {
  return Opt.filter(
    Arr.get(node.arguments, index),
    (argument): argument is ESTree.Expression => argument.type !== 'SpreadElement',
  );
}

/**
 * The first object literal argument of a call.
 *
 * @param node Call.
 */
export function objectArgument(node: ESTree.CallExpression): Opt.Option<ESTree.ObjectExpression> {
  return Arr.findFirst(
    node.arguments,
    (argument): argument is ESTree.ObjectExpression => argument.type === 'ObjectExpression',
  );
}

function isWrapperExpression(node: ESTree.Expression): node is WrapperExpression {
  return isWrapperExpressionType(node.type);
}

export function unwrapExpression(node: ESTree.Expression): ESTree.Expression {
  return isWrapperExpression(node) ? unwrapExpression(node.expression) : node;
}

const nonChildKeys: ReadonlySet<string> = new Set(['loc', 'parent', 'range']);

function childValues(value: object): ReadonlyArray<unknown> {
  return Arr.isArray(value)
    ? (value as ReadonlyArray<unknown>)
    : Arr.map(
        Arr.filter(R.toEntries(value), ([key]) => !nonChildKeys.has(key)),
        ([, child]) => child,
      );
}

function isNode(value: object): value is ESTree.Node {
  return P.hasProperty(value, 'type') && P.isString(value.type);
}

/**
 * Depth-first search of the syntax tree under `root`, stopping at the first node `visit` accepts.
 *
 * @param root Subtree root, included.
 * @param visit Stop condition.
 */
export function walkNodes(root: ESTree.Node, visit: (node: ESTree.Node) => boolean): boolean {
  const pending: Array<unknown> = [root];

  const seen = new WeakSet<object>();

  while (Arr.isArrayNonEmpty(pending)) {
    const value = pending.pop();

    if (!P.isObjectOrArray(value) || seen.has(value)) {
      continue;
    }

    seen.add(value);

    if (isNode(value) && visit(value)) {
      return true;
    }

    pending.push(...childValues(value));
  }

  return false;
}

export function containsIdentifier(root: ESTree.Node, name: string): boolean {
  return walkNodes(root, (node) => node.type === 'Identifier' && node.name === name);
}

export function isFunctionNode(node: ESTree.Node | null | undefined): node is FunctionNode {
  return P.isNotNullish(node) && isFunctionNodeType(node.type);
}

export const isConstDeclaration = Match.type<ESTree.Node | null | undefined>().pipe(
  Match.when({ type: 'VariableDeclaration', kind: 'const' }, Fn.constTrue),
  Match.orElse(Fn.constFalse),
);

export function firstIdentifierParameter(node: FunctionNode): Opt.Option<ESTree.BindingIdentifier> {
  return Opt.filter(
    Arr.head(node.params),
    (parameter): parameter is ESTree.BindingIdentifier => parameter.type === 'Identifier',
  );
}

export function functionUsesFirstParameter(node: FunctionNode): boolean {
  return Opt.exists(
    firstIdentifierParameter(node),
    (parameter) =>
      P.isNotNullish(node.body) &&
      !Str.startsWith('_')(parameter.name) &&
      containsIdentifier(node.body, parameter.name),
  );
}

/**
 * The parent of a node, when it has one.
 *
 * @param node Child.
 */
export function parentOf(node: ESTree.Node): Opt.Option<ESTree.Node> {
  return Opt.fromNullishOr(node.parent as ESTree.Node | null | undefined);
}

/**
 * The parent of a node, when it has the given `type`.
 *
 * @param node Child.
 * @param type Expected parent type.
 */
export function parentOfType<TType extends ESTree.Node['type']>(
  node: ESTree.Node,
  type: TType,
): Opt.Option<Extract<ESTree.Node, { readonly type: TType }>> {
  return Opt.filter(parentOf(node), (parent): parent is Extract<ESTree.Node, { readonly type: TType }> =>
    Opt.isSome(AST.narrow(parent, type)),
  );
}

/**
 * The nearest ancestor that passes `refinement`, walking up from the parent of `node`.
 *
 * @param node Start node, not tested itself.
 * @param refinement Ancestor test.
 */
export function findAncestor<TNode extends ESTree.Node>(
  node: ESTree.Node,
  refinement: P.Refinement<ESTree.Node, TNode>,
): Opt.Option<TNode> {
  return Opt.flatMap(parentOf(node), (parent) =>
    refinement(parent) ? Opt.some(parent) : findAncestor(parent, refinement),
  );
}

export function enclosingFunction(node: ESTree.Node): Opt.Option<FunctionNode> {
  return findAncestor(node, isFunctionNode);
}

/**
 * The call that receives `node` as a direct argument.
 *
 * @param node Callback.
 */
export function callbackCall(node: FunctionNode): Opt.Option<ESTree.CallExpression> {
  return Opt.filter(parentOfType(node, 'CallExpression'), (call) => containsSame<ESTree.Node>(call.arguments, node));
}

/**
 * Whether `inner` lies inside the source range of `outer`, inclusive.
 *
 * @param outer Enclosing node.
 * @param inner Node, comment or token.
 */
export function containsRange(outer: Ranged, inner: Ranged): boolean {
  return outer.range[0] <= inner.range[0] && inner.range[1] <= outer.range[1];
}

export function isStringLiteral(node: ESTree.Node): node is ESTree.StringLiteral {
  return node.type === 'Literal' && Str.isString(node.value);
}

export function isLiteral(node: ESTree.Node, value: string | number | boolean): boolean {
  return node.type === 'Literal' && node.value === value;
}

/**
 * Whether the value of an expression is thrown away: an expression statement, `void x`, or a non-final sequence item.
 *
 * @param node Expression.
 */
export function isDiscarded(node: ESTree.Node): boolean {
  return Opt.exists(
    parentOf(node),
    (parent) =>
      parent.type === 'ExpressionStatement' ||
      (parent.type === 'UnaryExpression' && parent.operator === 'void') ||
      (parent.type === 'SequenceExpression' && Opt.exists(Arr.last(parent.expressions), (last) => last !== node)),
  );
}

/**
 * Whether a construction calls a class whose name ends in `Error`, such as `new TypeError()` or `new
 * errors.HttpError()`.
 *
 * @param node Construction.
 */
export function isErrorConstructor(node: ESTree.NewExpression): boolean {
  return Opt.exists(Opt.map(staticPath(node.callee), Arr.lastNonEmpty), Str.endsWith('Error'));
}

/**
 * Whether `items` holds `item` itself. `Array.contains` compares plain objects such as syntax nodes and scope variables
 * structurally, which walks whole subtrees through their `parent` links.
 *
 * @param items Candidates.
 * @param item Object to look for.
 */
export function containsSame<T>(items: Iterable<T>, item: T): boolean {
  return Arr.containsWith(Equivalence.strictEqual<T>())(items, item);
}

/**
 * Whether an option holds `item` itself; see `containsSame`.
 *
 * @param option Option to inspect.
 * @param item Object to look for.
 */
export function isSomeSame<T>(option: Opt.Option<T>, item: T): boolean {
  return Opt.containsWith(Equivalence.strictEqual<T>())(option, item);
}

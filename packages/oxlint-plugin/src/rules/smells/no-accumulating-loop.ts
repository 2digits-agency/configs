import { Diagnostic, Rule, RuleContext, Visitor, type ESTree, type Variable } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Order from 'effect/Order';
import * as Schema from 'effect/Schema';
import * as Tuple from 'effect/Tuple';

import {
  containsRange,
  findAncestor,
  isAnyFunction,
  isWrapperExpressionType,
  staticPropertyName,
  unwrapExpression,
  walkNodes,
} from '../../internal/ast';
import { isTestFilename } from '../../internal/files';
import { ruleMeta } from '../../internal/meta';
import { lookupVariable, soleDefinition } from '../../internal/scope';

type LoopNode = ESTree.ForInStatement | ESTree.ForOfStatement | ESTree.ForStatement;

interface Accumulation {
  /**
   * The call or assignment that adds to the collection.
   */
  readonly node: ESTree.CallExpression | ESTree.AssignmentExpression;
  readonly target: ESTree.IdentifierReference;
  readonly how: string;
}

const isCollectingMethod = Schema.is(Schema.Literals(['push', 'unshift', 'set', 'add']));

const isRemovingMethod = Schema.is(
  Schema.Literals(['clear', 'delete', 'fill', 'pop', 'reverse', 'shift', 'sort', 'splice']),
);

const isEmptyCollectionConstructor = Schema.is(Schema.Literals(['Map', 'Set']));

const LoopType = Schema.Literals(['ForStatement', 'ForInStatement', 'ForOfStatement']);

const isLoopType = Schema.is(LoopType);

const isBreakableType = Schema.is(
  Schema.Literals([
    'ForStatement',
    'ForInStatement',
    'ForOfStatement',
    'WhileStatement',
    'DoWhileStatement',
    'SwitchStatement',
  ]),
);

function isLoop(node: ESTree.Node): node is LoopNode {
  return isLoopType(node.type);
}

function isIdentifierNamed(node: ESTree.Expression, name: string): boolean {
  const value = unwrapExpression(node);

  return value.type === 'Identifier' && value.name === name;
}

/**
 * Every node under `root`, including `root`.
 *
 * @param root Subtree root.
 */
function descendants(root: ESTree.Node): ReadonlyArray<ESTree.Node> {
  const nodes: Array<ESTree.Node> = [];

  walkNodes(root, (node) => {
    nodes.push(node);

    return false;
  });

  return nodes;
}

/**
 * Whether `node` runs as part of `loop` itself rather than in a function defined inside it.
 *
 * @param node Node inside the loop.
 * @param loop Loop.
 */
function isOwnedBy(node: ESTree.Node, loop: LoopNode): boolean {
  return Opt.contains(
    findAncestor(node, (ancestor): ancestor is ESTree.Node => ancestor === loop || isAnyFunction(ancestor)),
    loop,
  );
}

/**
 * Whether a `return` or `break` leaves `loop`, which makes the loop a search rather than a transform.
 *
 * @param node Statement inside the loop.
 * @param loop Loop.
 */
function exitsLoop(node: ESTree.Node, loop: LoopNode): boolean {
  if (node.type === 'ReturnStatement') {
    return isOwnedBy(node, loop);
  }

  if (node.type !== 'BreakStatement') {
    return false;
  }

  const { label } = node;

  return Opt.contains(
    findAncestor(
      node,
      (ancestor): ancestor is ESTree.Node =>
        ancestor === loop ||
        isAnyFunction(ancestor) ||
        (label
          ? ancestor.type === 'LabeledStatement' && ancestor.label.name === label.name
          : isBreakableType(ancestor.type)),
    ),
    loop,
  );
}

/**
 * Whether the loop is a search that exits early, or awaits on each iteration, which `no-await-in-loop` already reports.
 *
 * @param loop Loop.
 */
function isSearchOrAsync(loop: LoopNode): boolean {
  return (
    (loop.type === 'ForOfStatement' && loop.await) ||
    walkNodes(loop.body, (node) => exitsLoop(node, loop) || (node.type === 'AwaitExpression' && isOwnedBy(node, loop)))
  );
}

/**
 * How a call adds to a collection named by an identifier: `out.push(x)`, `ids.add(x)` or `byId.set(key, x)`.
 *
 * @param node Call inside a loop.
 */
function callAccumulation(node: ESTree.CallExpression): Opt.Option<Accumulation> {
  const callee = unwrapExpression(node.callee);

  if (callee.type !== 'MemberExpression' || callee.computed) {
    return Opt.none();
  }

  const object = unwrapExpression(callee.object);

  return object.type === 'Identifier' && isCollectingMethod(callee.property.name)
    ? Opt.some({ node, target: object, how: `calling \`.${callee.property.name}\`` })
    : Opt.none();
}

/**
 * Whether an expression copies the collection `name` into a new one: `[...all, x]` or `{ ...all, x }`.
 *
 * @param right Assigned value.
 * @param name Collection name.
 */
function spreadsItself(right: ESTree.Expression, name: string): boolean {
  if (right.type === 'ArrayExpression') {
    return Arr.some(
      right.elements,
      (element) => element?.type === 'SpreadElement' && isIdentifierNamed(element.argument, name),
    );
  }

  return (
    right.type === 'ObjectExpression' &&
    Arr.some(
      right.properties,
      (property) => property.type === 'SpreadElement' && isIdentifierNamed(property.argument, name),
    )
  );
}

/**
 * How an assignment adds to a collection named by an identifier: `byId[key] = x`, `all = [...all, x]` or `all =
 * all.concat(x)`.
 *
 * @param node Assignment inside a loop.
 */
function assignmentAccumulation(node: ESTree.AssignmentExpression): Opt.Option<Accumulation> {
  const { left } = node;

  if (left.type === 'MemberExpression') {
    const object = unwrapExpression(left.object);

    return left.computed && object.type === 'Identifier'
      ? Opt.some({ node, target: object, how: 'assigning computed keys' })
      : Opt.none();
  }

  if (left.type !== 'Identifier' || node.operator !== '=') {
    return Opt.none();
  }

  const right = unwrapExpression(node.right);

  if (spreadsItself(right, left.name)) {
    return Opt.some({ node, target: left, how: 'copying it with a spread' });
  }

  const concatenates =
    right.type === 'CallExpression' &&
    right.callee.type === 'MemberExpression' &&
    Opt.contains(staticPropertyName(right.callee), 'concat') &&
    isIdentifierNamed(right.callee.object, left.name);

  return concatenates ? Opt.some({ node, target: left, how: 'calling `.concat`' }) : Opt.none();
}

/**
 * How a node adds to a collection named by an identifier.
 *
 * @param node Node inside a loop.
 */
function accumulation(node: ESTree.Node): Opt.Option<Accumulation> {
  if (node.type === 'CallExpression') {
    return callAccumulation(node);
  }

  return node.type === 'AssignmentExpression' ? assignmentAccumulation(node) : Opt.none();
}

/**
 * Whether an initializer is an empty array, object, Map or Set, so the loop builds the collection from nothing.
 *
 * @param init Variable initializer.
 */
function isEmptyCollection(init: ESTree.Expression): boolean {
  const value = unwrapExpression(init);

  return (
    (value.type === 'ArrayExpression' && Arr.isReadonlyArrayEmpty(value.elements)) ||
    (value.type === 'ObjectExpression' && Arr.isReadonlyArrayEmpty(value.properties)) ||
    (value.type === 'NewExpression' &&
      value.callee.type === 'Identifier' &&
      isEmptyCollectionConstructor(value.callee.name) &&
      Arr.isReadonlyArrayEmpty(value.arguments))
  );
}

/**
 * Whether a reference reads entries while the collection is built, as `groupBy` does: `byKey.get(key)` or `byKey[key]`.
 *
 * @param identifier Reference to the collection.
 */
function isEntryRead(identifier: ESTree.Node): boolean {
  const { parent } = identifier;

  return (
    parent?.type === 'MemberExpression' &&
    parent.object === identifier &&
    (parent.computed || Opt.contains(staticPropertyName(parent), 'get'))
  );
}

function enclosingAnyFunction(node: ESTree.Node): Opt.Option<ESTree.Node> {
  return findAncestor(node, isAnyFunction);
}

const bySourcePosition = Order.mapInput(Order.Number, ({ node }: Accumulation) => Tuple.get(node.range, 0));

/**
 * Report `for` loops that build an array, object, Map or Set declared outside the loop.
 */
export const noAccumulatingLoop = Rule.define({
  name: 'no-accumulating-loop',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Disallow `for` loops that build an empty array, object, Map or Set declared before the loop.',
    messages: {
      loop: 'This loop builds `{{target}}` by {{how}} on each iteration, which hides the transformation in control flow and mutation. Express it as a pipeline over the source: `map`, `filter`, `flatMap` or `groupBy` from Effect `Array`, `Object.fromEntries` or `new Map(…)`, or `Effect.forEach` when each iteration runs an effect.',
    },
    url: 'https://github.com/K-Mistele/anti-slop/blob/main/src/martinfowler/rules/loops.ts',
  }),
  *create() {
    const ctx = yield* RuleContext;

    if (isTestFilename(ctx.filename)) {
      return {};
    }

    const { sourceCode } = ctx;

    function variableOf(identifier: ESTree.IdentifierReference): Opt.Option<Variable> {
      return lookupVariable(sourceCode, identifier, identifier.name);
    }

    function isDeclaredOutside(variable: Opt.Option<Variable>, loop: LoopNode): boolean {
      return !Opt.exists(variable, ({ defs }) => Arr.some(defs, ({ name }) => containsRange(loop, name)));
    }

    /**
     * Names of bindings declared outside `loop` that its body reassigns, writes properties on, or removes entries from.
     *
     * @param loop Loop.
     */
    function outerWrites(loop: LoopNode): ReadonlySet<string> {
      const roots = Arr.getSomes(
        Arr.map(descendants(loop.body), (node) => {
          if (node.type === 'AssignmentExpression') {
            return rootIdentifier(node.left);
          }

          if (node.type === 'UpdateExpression') {
            return rootIdentifier(node.argument);
          }

          return node.type === 'CallExpression' &&
            node.callee.type === 'MemberExpression' &&
            Opt.exists(staticPropertyName(node.callee), isRemovingMethod)
            ? rootIdentifier(node.callee.object)
            : Opt.none();
        }),
      );

      return new Set(
        Arr.map(
          Arr.filter(roots, (root) => isDeclaredOutside(variableOf(root), loop)),
          ({ name }) => name,
        ),
      );
    }

    /**
     * Whether the loop alone builds the collection: it starts empty in the same function, nothing touches it before the
     * loop, the loop only adds to it or reads entries, and nothing adds to it after the loop.
     *
     * @param loop Loop.
     * @param variable Collection.
     * @param sites Places in the loop that add to the collection.
     */
    function isBuiltOnlyBy(loop: LoopNode, variable: Variable, sites: ReadonlyArray<Accumulation>): boolean {
      const declarator = Opt.flatMap(soleDefinition(Opt.some(variable)), ({ node }) =>
        node.type === 'VariableDeclarator' && node.init && isEmptyCollection(node.init) ? Opt.some(node) : Opt.none(),
      );

      if (
        Opt.isNone(declarator) ||
        containsRange(loop, declarator.value) ||
        Opt.getOrNull(enclosingAnyFunction(loop)) !== Opt.getOrNull(enclosingAnyFunction(declarator.value))
      ) {
        return false;
      }

      return Arr.every(variable.references, ({ identifier, init }) => {
        if (init) {
          return true;
        }

        if (containsRange(loop, identifier)) {
          return Arr.some(sites, ({ node }) => containsRange(node, identifier)) || isEntryRead(identifier);
        }

        return Tuple.get(identifier.range, 0) > Tuple.get(loop.range, 1) && !isMutation(identifier);
      });
    }

    /**
     * Whether a qualifying loop between `loop` and the declaration of its collection reports it instead.
     *
     * @param loop Loop.
     * @param declaration Declaration of the collection.
     */
    function isReportedByOuterLoop(loop: LoopNode, declaration: ESTree.Node): boolean {
      return Opt.exists(
        findAncestor(
          loop,
          (ancestor): ancestor is ESTree.Node =>
            containsRange(ancestor, declaration) || (isLoop(ancestor) && !isSearchOrAsync(ancestor)),
        ),
        (ancestor) => !containsRange(ancestor, declaration),
      );
    }

    const check = Effect.fnUntraced(function* (loop: LoopNode) {
      if (isSearchOrAsync(loop)) {
        return;
      }

      const outer = Arr.filter(Arr.getSomes(Arr.map(descendants(loop.body), accumulation)), ({ target }) =>
        isDeclaredOutside(variableOf(target), loop),
      );

      if (!Arr.isArrayNonEmpty(outer)) {
        return;
      }

      const written = outerWrites(loop);

      const qualifies = Arr.every(outer, ({ target }) =>
        Opt.exists(
          variableOf(target),
          (variable) =>
            Arr.every([...written], (name) => name === target.name) &&
            isBuiltOnlyBy(
              loop,
              variable,
              Arr.filter(outer, (site) => site.target.name === target.name),
            ) &&
            !isReportedByOuterLoop(
              loop,
              Opt.getOrElse(Arr.head(variable.identifiers), () => target),
            ),
        ),
      );

      if (!qualifies) {
        return;
      }

      const [first] = Arr.sort(outer, bySourcePosition);

      yield* ctx.report(
        Diagnostic.fromId({ node: loop, messageId: 'loop', data: { target: first.target.name, how: first.how } }),
      );
    });

    return Visitor.merge(
      Visitor.on('ForStatement', check),
      Visitor.on('ForInStatement', check),
      Visitor.on('ForOfStatement', check),
    );
  },
});

/**
 * The identifier at the root of an assignment target such as `state.done` or `counts[key]`.
 *
 * @param node Assignment target.
 */
function rootIdentifier(node: ESTree.Node): Opt.Option<ESTree.IdentifierReference> {
  let target = node;

  while (target.type === 'MemberExpression' || isWrapperExpressionType(target.type)) {
    target = target.type === 'MemberExpression' ? target.object : unwrapExpression(target as ESTree.Expression);
  }

  return target.type === 'Identifier' ? Opt.some(target as ESTree.IdentifierReference) : Opt.none();
}

/**
 * Whether a reference adds to or reassigns the collection it names.
 *
 * @param identifier Reference.
 */
function isMutation(identifier: ESTree.Node): boolean {
  const { parent } = identifier;

  if (parent?.type === 'AssignmentExpression' && parent.left === identifier) {
    return true;
  }

  if (parent?.type !== 'MemberExpression' || parent.object !== identifier) {
    return false;
  }

  return Opt.exists(
    Opt.fromNullishOr(parent.parent as ESTree.Node | null | undefined),
    (outer) =>
      ((outer.type === 'CallExpression' && outer.callee === parent) ||
        (outer.type === 'AssignmentExpression' && outer.left === parent)) &&
      Opt.isSome(accumulation(outer)),
  );
}

import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import type * as Hash from 'effect/Hash';
import * as HashSet from 'effect/HashSet';
import * as Opt from 'effect/Option';
import * as Ref from 'effect/Ref';
import * as Schema from 'effect/Schema';

import { argumentAt, isEqualityOperator, staticPath } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

const KeyedMethod = Schema.Literals(['delete', 'get', 'has', 'set']);

const isKeyedMethod = Schema.is(KeyedMethod);

function isHashCall(node: ESTree.Node, imports: ImportBindings): boolean {
  return node.type === 'CallExpression' && imports.isApi(node.callee, 'Hash', 'hash' satisfies keyof typeof Hash);
}

function isKeyedCall(node: ESTree.CallExpression): boolean {
  return (
    node.callee.type === 'MemberExpression' &&
    Opt.exists(staticPath(node.callee), (path) => isKeyedMethod(Arr.lastNonEmpty(path)))
  );
}

export const noHashAsIdentity = Rule.define({
  name: 'no-hash-as-identity',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow using Hash.hash output as collision-free identity.',
    messages: {
      hashIdentity:
        'Hash.hash is a bucketing hint, not a unique identity. Use HashMap/Equal.equals or a real identifier instead.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/482',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    const hashBindings = yield* Ref.make(HashSet.empty<string>());

    function isHashValue(node: ESTree.Node) {
      return isHashCall(node, imports)
        ? Effect.succeed(true)
        : node.type === 'Identifier'
          ? Effect.map(Ref.get(hashBindings), HashSet.has(node.name))
          : Effect.succeed(false);
    }

    function reportWhen(node: ESTree.Node, condition: Effect.Effect<boolean>) {
      return Effect.when(ctx.report(Diagnostic.fromId({ node, messageId: 'hashIdentity' })), condition);
    }

    return Visitor.merge(
      Visitor.on('VariableDeclarator', (node) =>
        node.id.type === 'Identifier' && node.init && isHashCall(node.init, imports)
          ? Ref.update(hashBindings, HashSet.add(node.id.name))
          : Effect.void,
      ),
      Visitor.on('CallExpression', (node) =>
        isKeyedCall(node)
          ? Opt.match(argumentAt(node, 0), {
              onNone: () => Effect.void,
              onSome: (key) => reportWhen(key, isHashValue(key)),
            })
          : Effect.void,
      ),
      Visitor.on('BinaryExpression', (node) =>
        isEqualityOperator(node.operator)
          ? reportWhen(
              node,
              Effect.map(Effect.all([isHashValue(node.left), isHashValue(node.right)]), Arr.every(Boolean)),
            )
          : Effect.void,
      ),
      Visitor.on('MemberExpression', (node) =>
        node.computed ? reportWhen(node.property, isHashValue(node.property)) : Effect.void,
      ),
    );
  },
});

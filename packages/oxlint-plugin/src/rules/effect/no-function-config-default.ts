import { Diagnostic, RuleContext, Visitor, type CreateRule, type ESTree, type Variable } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import type * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import {
  argumentAt,
  containsSame,
  isConstDeclaration,
  isFunctionNode,
  isSomeSame,
  parentOfType,
  staticPropertyName,
  unwrapExpression,
} from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';
import { isImportedApi, resolveVariable, soleDefinition } from '../../internal/scope';

/**
 * The initializer of a `const` the identifier names, followed through `const` aliases; none for anything reassigned.
 *
 * @param node Expression.
 * @param seen Variables already followed.
 */
function resolveConst(
  node: ESTree.Expression,
  seen: ReadonlyArray<Variable> = [],
): Effect.Effect<Opt.Option<ESTree.Expression>, never, RuleContext> {
  const expression = unwrapExpression(node);

  if (expression.type !== 'Identifier') {
    return Effect.succeedSome(expression);
  }

  return Effect.flatMap(resolveVariable(expression, expression.name), (resolved) => {
    const initializer = Opt.flatMap(resolved, (variable) =>
      Opt.flatMap(soleDefinition(resolved), (definition) => {
        const declaration = definition.node;

        return containsSame(seen, variable) ||
          declaration.type !== 'VariableDeclarator' ||
          declaration.id.type !== 'Identifier' ||
          !isConstDeclaration(definition.parent) ||
          !declaration.init ||
          Arr.some(variable.references, (reference) => reference.isWrite() && !reference.init)
          ? Opt.none()
          : Opt.some([variable, declaration.init] as const);
      }),
    );

    return Opt.match(initializer, {
      onNone: () => Effect.succeedNone,
      onSome: ([variable, init]) => resolveConst(init, [...seen, variable]),
    });
  });
}

/**
 * The config `Config.withDefault` applies to: its data-first argument, or the receiver of
 * `.pipe(Config.withDefault(…))`. Earlier pipe operations may change the success value, so only the first operation is
 * proven.
 *
 * @param node `Config.withDefault` call.
 */
function receivingConfig(node: ESTree.CallExpression): Opt.Option<ESTree.Expression> {
  if (node.arguments.length === 2) {
    return argumentAt(node, 0);
  }

  return node.arguments.length === 1
    ? Opt.flatMap(
        Opt.filter(
          parentOfType(node, 'CallExpression'),
          (parent) =>
            isSomeSame<ESTree.Node>(argumentAt(parent, 0), node) &&
            parent.callee.type === 'MemberExpression' &&
            Opt.contains(staticPropertyName(parent.callee), 'pipe'),
        ),
        (parent) => (parent.callee.type === 'MemberExpression' ? Opt.some(parent.callee.object) : Opt.none()),
      )
    : Opt.none();
}

export const noFunctionConfigDefault: CreateRule = defineRule({
  name: 'no-function-config-default',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow obsolete lazy callbacks passed to the now-eager Config.withDefault API.',
    messages: {
      functionDefault:
        'Config.withDefault takes an eager value. This callback becomes the configured value; pass the returned value directly.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/408',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    /**
     * Whether the config is `Config.succeed(() => …)`, whose value really is a function.
     *
     * @param node `Config.withDefault` call.
     */
    const isFunctionConfig = Effect.fnUntraced(function* (node: ESTree.CallExpression) {
      const config = receivingConfig(node);

      const receiver = Opt.isSome(config) ? yield* resolveConst(config.value) : Opt.none();

      if (
        Opt.isNone(receiver) ||
        receiver.value.type !== 'CallExpression' ||
        !imports.isApi(receiver.value.callee, 'Config', 'succeed' satisfies keyof typeof Config)
      ) {
        return false;
      }

      const call = receiver.value;

      return (yield* isImportedApi(call.callee)) && Opt.exists(argumentAt(call, 0), isFunctionNode);
    });

    return Visitor.on('CallExpression', (node) =>
      Effect.gen(function* () {
        if (
          !imports.isApi(node.callee, 'Config', 'withDefault' satisfies keyof typeof Config) ||
          !(yield* isImportedApi(node.callee)) ||
          (yield* isFunctionConfig(node))
        ) {
          return;
        }

        const fallback = argumentAt(node, node.arguments.length - 1);

        if (Opt.isSome(fallback) && isFunctionNode(fallback.value) && Arr.isReadonlyArrayEmpty(fallback.value.params)) {
          yield* ctx.report(Diagnostic.fromId({ node: fallback.value, messageId: 'functionDefault' }));
        }
      }),
    );
  },
});

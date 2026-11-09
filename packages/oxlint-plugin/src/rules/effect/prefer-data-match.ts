import { Diagnostic, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';

import { parentOf, unwrapExpression, walkNodes } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';

const guards: Readonly<Record<string, ReadonlyArray<string>>> = {
  Exit: ['isSuccess', 'isFailure'],
  Result: ['isSuccess', 'isFailure'],
  Option: ['isSome', 'isNone'],
};

/**
 * The `Exit`, `Result` or `Option` guard path tested by `test`, also when negated.
 *
 * @param test Condition of an if statement or ternary.
 * @param imports Import bindings of the file.
 */
function guardPath(test: ESTree.Expression, imports: ImportBindings): Opt.Option<readonly [string, string]> {
  const expression = unwrapExpression(test.type === 'UnaryExpression' && test.operator === '!' ? test.argument : test);

  if (expression.type !== 'CallExpression' || expression.arguments.length !== 1) {
    return Opt.none();
  }

  return Opt.flatMap(imports.path(expression.callee), (path) => {
    const [module, guard] = path;

    return path.length === 2 &&
      P.isNotUndefined(module) &&
      P.isNotUndefined(guard) &&
      Opt.exists(R.get(guards, module), Arr.contains(guard))
      ? Opt.some([module, guard] as const)
      : Opt.none();
  });
}

/**
 * Whether a branch yields or awaits, which a synchronous match handler cannot hold.
 *
 * @param node Branch to search.
 */
function suspends(node: ESTree.Node): boolean {
  return walkNodes(node, (child) => child.type === 'YieldExpression' || child.type === 'AwaitExpression');
}

/**
 * Whether a branch ends in `return value` and does not suspend.
 *
 * @param node Branch statement.
 */
function returnsValue(node: Opt.Option<ESTree.Statement>): boolean {
  return Opt.exists(node, (statement) =>
    Opt.exists(
      statement.type === 'BlockStatement' ? Arr.last(statement.body) : Opt.some(statement),
      (last) => last.type === 'ReturnStatement' && P.isNotNull(last.argument) && !suspends(statement),
    ),
  );
}

/**
 * The `return` after `node` in its block, which runs when an `if` without `else` falls through.
 *
 * @param node Statement to look past.
 */
function nextReturn(node: ESTree.IfStatement): Opt.Option<ESTree.Statement> {
  return Opt.flatMap(
    Opt.filter(parentOf(node), (parent) => parent.type === 'BlockStatement' || parent.type === 'Program'),
    (parent) => {
      const body = (parent as ESTree.BlockStatement | ESTree.Program).body as ReadonlyArray<ESTree.Node>;

      return Opt.filter(
        Arr.get(body, body.indexOf(node) + 1),
        (next): next is ESTree.ReturnStatement => next.type === 'ReturnStatement',
      );
    },
  );
}

/**
 * Prefer the data type's own `match` over branching on its guards when both branches produce a value.
 */
export const preferDataMatch: CreateRule = defineRule({
  name: 'prefer-data-match',
  meta: ruleMeta({
    type: 'suggestion',
    description:
      'Use Exit.match, Result.match or Option.match instead of branching on their guards to produce a value.',
    messages: {
      preferMatch:
        'Use `{{module}}.match` instead of branching on `{{module}}.{{guard}}` and producing a value in both branches.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/Option',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    function reportWhen(node: ESTree.Node, test: ESTree.Expression, producesValues: () => boolean) {
      return Opt.match(Opt.filter(guardPath(test, imports), producesValues), {
        onNone: () => Effect.void,
        onSome: ([module, guard]) =>
          ctx.report(Diagnostic.fromId({ node, messageId: 'preferMatch', data: { module, guard } })),
      });
    }

    return Visitor.merge(
      Visitor.on('ConditionalExpression', (node) =>
        reportWhen(node, node.test, () => !suspends(node.consequent) && !suspends(node.alternate)),
      ),
      Visitor.on('IfStatement', (node) =>
        reportWhen(
          node,
          node.test,
          () =>
            returnsValue(Opt.some(node.consequent)) &&
            returnsValue(Opt.orElse(Opt.fromNullishOr(node.alternate), () => nextReturn(node))),
        ),
      ),
    );
  },
});

import type { ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as P from 'effect/Predicate';

import { canonicalPath, defineEffectRule, ruleMeta, unwrapExpression, walkNodes, type FileState } from '../../utils';

const guards: ReadonlyMap<string, ReadonlyArray<string>> = new Map([
  ['Exit', ['isSuccess', 'isFailure']],
  ['Result', ['isSuccess', 'isFailure']],
  ['Option', ['isSome', 'isNone']],
]);

/**
 * The `Exit`, `Result` or `Option` guard path tested by `test`, also when negated.
 *
 * @param test Condition of an if statement or ternary.
 * @param state Import bindings of the file.
 */
function guardPath(test: ESTree.Expression, state: FileState): ReadonlyArray<string> | undefined {
  const expression = unwrapExpression(test.type === 'UnaryExpression' && test.operator === '!' ? test.argument : test);

  if (expression.type !== 'CallExpression' || expression.arguments.length !== 1) {
    return undefined;
  }

  const path = canonicalPath(expression.callee, state);

  return path?.length === 2 && Arr.contains(guards.get(path[0] ?? '') ?? [], path[1]) ? path : undefined;
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
function returnsValue(node: ESTree.Statement | null | undefined): boolean {
  if (!node) {
    return false;
  }

  const last = node.type === 'BlockStatement' ? node.body.at(-1) : node;

  return last?.type === 'ReturnStatement' && P.isNotNull(last.argument) && !suspends(node);
}

/**
 * The statement after `node` in its block, which runs when an `if` without `else` falls through.
 *
 * @param node Statement to look past.
 */
function nextStatement(node: ESTree.IfStatement): ESTree.Statement | undefined {
  const parent = node.parent;

  if (parent.type !== 'BlockStatement' && parent.type !== 'Program') {
    return undefined;
  }

  const body: ReadonlyArray<ESTree.Node> = parent.body;

  const next = body[body.indexOf(node) + 1];

  return next?.type === 'ReturnStatement' ? next : undefined;
}

/**
 * Prefer the data type's own `match` over branching on its guards when both branches produce a value.
 */
export const preferDataMatch: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Use Exit.match, Result.match or Option.match instead of branching on their guards to produce a value.',
    {
      preferMatch:
        'Use `{{module}}.match` instead of branching on `{{module}}.{{guard}}` and producing a value in both branches.',
    },
    'https://www.effect.website/docs/v4/api/effect/Option',
  ),
  (context, getState) => {
    function report(node: ESTree.Node, path: ReadonlyArray<string>): void {
      context.report({ node, messageId: 'preferMatch', data: { module: path[0] ?? '', guard: path[1] ?? '' } });
    }

    return {
      ConditionalExpression(node) {
        const path = guardPath(node.test, getState());

        if (P.isNotUndefined(path) && !suspends(node.consequent) && !suspends(node.alternate)) {
          report(node, path);
        }
      },
      IfStatement(node) {
        const path = guardPath(node.test, getState());

        if (
          P.isNotUndefined(path) &&
          returnsValue(node.consequent) &&
          returnsValue(node.alternate ?? nextStatement(node))
        ) {
          report(node, path);
        }
      },
    };
  },
);

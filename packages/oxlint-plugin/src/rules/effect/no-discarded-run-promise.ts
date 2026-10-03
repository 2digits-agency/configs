import type { Context, ESTree, Rule } from '@oxlint/plugins';

import { importedApi } from '../../fixes';
import {
  argumentAt,
  defineEffectRule,
  isApi,
  isDiscarded,
  isGlobalIdentifier,
  isWrapperExpression,
  ruleMeta,
  unwrapExpression,
  type FileState,
} from '../../utils';

function importedRunner(context: Context, node: ESTree.CallExpression, state: FileState): boolean {
  const callee = unwrapExpression(node.callee);

  if (isApi(callee, state, 'Effect', 'runPromise')) {
    return importedApi(context, callee);
  }

  return (
    callee.type === 'CallExpression' &&
    isApi(unwrapExpression(callee.callee), state, 'Effect', 'runPromiseWith') &&
    importedApi(context, unwrapExpression(callee.callee))
  );
}

function outerExpression(node: ESTree.Expression): ESTree.Expression {
  let current = node;

  while (isWrapperExpression(current.parent)) {
    current = current.parent;
  }

  return current;
}

function discardedBoundary(node: ESTree.Expression): boolean {
  let current = outerExpression(node);

  while (current.parent.type === 'SequenceExpression' && current.parent.expressions.at(-1) === current) {
    current = outerExpression(current.parent);
  }

  return isDiscarded(current);
}

function staticRunnerCall(node: ESTree.CallExpression): boolean {
  let current: ESTree.Expression = node;

  for (;;) {
    current = unwrapExpression(current);

    if (current.type === 'CallExpression' && !current.optional) {
      current = current.callee;
    } else if (current.type === 'MemberExpression' && !current.computed && !current.optional) {
      current = current.object;
    } else {
      return current.type === 'Identifier';
    }
  }
}

function promiseLink(
  member: ESTree.MemberExpression,
): { readonly call: ESTree.CallExpression; readonly method: string } | undefined {
  const memberBoundary = outerExpression(member);
  const call = memberBoundary.parent;

  if (
    member.computed ||
    member.optional ||
    member.property.type !== 'Identifier' ||
    !['then', 'finally', 'catch'].includes(member.property.name) ||
    call.type !== 'CallExpression' ||
    call.callee !== memberBoundary ||
    call.optional ||
    call.arguments.some((argument) => argument.type === 'SpreadElement')
  ) {
    return undefined;
  }

  return { call, method: member.property.name };
}

function absentRejectionHandler(handler: ESTree.Expression | undefined, context: Context): boolean {
  if (handler === undefined) {
    return true;
  }

  const expression = unwrapExpression(handler);

  return (
    (expression.type === 'Literal' && expression.value === null) || isGlobalIdentifier(expression, context, 'undefined')
  );
}

export const noDiscardedRunPromise: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow discarded Effect.runPromise results that can become unhandled rejections.',
    {
      discarded:
        'The Promise returned by Effect.runPromise is discarded. Await/return/handle it, or use Effect.runFork for fire-and-forget work.',
      discardedChain:
        'This discarded Effect runner Promise chain has no explicit rejection handler. Await/return it or add deliberate rejection handling; redesign fire-and-forget work manually.',
    },
    'https://github.com/Effect-TS/tsgo/issues/643',
  ),
  (context, getState) => ({
    CallExpression(node) {
      if (!importedRunner(context, node, getState())) {
        return;
      }

      let boundary = outerExpression(node);
      let chained = false;

      while (boundary.parent.type === 'MemberExpression' && boundary.parent.object === boundary) {
        const link = promiseLink(boundary.parent);

        if (link === undefined) {
          return;
        }

        const { call, method } = link;
        const handler = argumentAt(call, method === 'catch' ? 0 : 1);

        // Callable handlers and unknown values both suppress the diagnostic; unknown is not assumed callable.
        if (method !== 'finally' && !absentRejectionHandler(handler, context)) {
          return;
        }

        chained = true;
        boundary = outerExpression(call);
      }

      if (chained && !staticRunnerCall(node)) {
        return;
      }

      if (discardedBoundary(boundary)) {
        context.report({ node: boundary, messageId: chained ? 'discardedChain' : 'discarded' });
      }
    },
  }),
);

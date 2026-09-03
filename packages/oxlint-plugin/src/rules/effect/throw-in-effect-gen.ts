import type { ESTree, Rule } from '@oxlint/plugins';

import {
  argumentAt,
  callbackCall,
  defineEffectRule,
  isApi,
  isFunctionNode,
  ruleMeta,
  type FileState,
  type FunctionNode,
} from '../../utils';

function capturedByEffectTry(node: FunctionNode, state: FileState): boolean {
  const parent = node.parent;

  if (parent.type === 'CallExpression' && argumentAt(parent, 0) === node) {
    return isApi(parent.callee, state, 'Effect', 'try') || isApi(parent.callee, state, 'Effect', 'tryPromise');
  }

  if (parent.type !== 'Property' || parent.key.type !== 'Identifier' || parent.key.name !== 'try') {
    return false;
  }

  const object = parent.parent;

  return (
    object.type === 'ObjectExpression' &&
    object.parent.type === 'CallExpression' &&
    (isApi(object.parent.callee, state, 'Effect', 'try') || isApi(object.parent.callee, state, 'Effect', 'tryPromise'))
  );
}

export const throwInEffectGen: Rule = defineEffectRule(
  ruleMeta('problem', 'Disallow throw in Effect generator APIs because it creates an untyped defect.', {
    throwInGen: 'Use yield* Effect.fail(...) instead of throw so the failure stays in the typed error channel.',
  }),
  (context, getState) => ({
    ThrowStatement(node) {
      const state = getState();
      let callback: ESTree.Node | undefined = node.parent;

      while (callback && !isFunctionNode(callback)) {
        callback = callback.parent ?? undefined;
      }

      if (callback === undefined || capturedByEffectTry(callback, state)) {
        return;
      }

      const call = callbackCall(callback);
      const direct =
        call !== undefined && ['fn', 'fnUntraced', 'gen'].some((method) => isApi(call.callee, state, 'Effect', method));
      const outerCallee = call?.callee;
      const curried =
        outerCallee?.type === 'CallExpression' &&
        ['fn', 'fnUntraced'].some((method) => isApi(outerCallee.callee, state, 'Effect', method));

      if (direct || curried) {
        context.report({ node, messageId: 'throwInGen' });
      }
    },
  }),
);

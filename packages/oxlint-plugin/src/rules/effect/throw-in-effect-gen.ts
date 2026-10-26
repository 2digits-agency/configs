import type { Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import type * as Effect from 'effect/Effect';

import {
  argumentAt,
  callbackCall,
  defineEffectRule,
  enclosingFunction,
  isAnyApi,
  isApi,
  ruleMeta,
  type FileState,
  type FunctionNode,
} from '../../utils';

const generatorMethods = ['fn', 'fnUntraced', 'gen'] as const satisfies ReadonlyArray<keyof typeof Effect>;

const curriedGeneratorMethods = ['fn', 'fnUntraced'] as const satisfies ReadonlyArray<keyof typeof Effect>;

const tryMethods = ['try', 'tryPromise'] as const satisfies ReadonlyArray<keyof typeof Effect>;

function capturedByEffectTry(node: FunctionNode, state: FileState): boolean {
  const parent = node.parent;

  if (parent.type === 'CallExpression' && argumentAt(parent, 0) === node) {
    return isAnyApi(parent.callee, state, 'Effect', tryMethods);
  }

  if (parent.type !== 'Property' || parent.key.type !== 'Identifier' || parent.key.name !== 'try') {
    return false;
  }

  const object = parent.parent;

  return (
    object.type === 'ObjectExpression' &&
    object.parent.type === 'CallExpression' &&
    isAnyApi(object.parent.callee, state, 'Effect', tryMethods)
  );
}

export const throwInEffectGen: Rule = defineEffectRule(
  ruleMeta('problem', 'Disallow throw in Effect generator APIs because it creates an untyped defect.', {
    throwInGen: 'Use yield* Effect.fail(...) instead of throw so the failure stays in the typed error channel.',
  }),
  (context, getState) => ({
    ThrowStatement(node) {
      const state = getState();

      const callback = enclosingFunction(node);

      if (callback === undefined || capturedByEffectTry(callback, state)) {
        return;
      }

      const call = callbackCall(callback);

      const direct =
        call !== undefined && Arr.some(generatorMethods, (method) => isApi(call.callee, state, 'Effect', method));

      const outerCallee = call?.callee;

      const curried =
        outerCallee?.type === 'CallExpression' &&
        Arr.some(curriedGeneratorMethods, (method) => isApi(outerCallee.callee, state, 'Effect', method));

      if (direct || curried) {
        context.report({ node, messageId: 'throwInGen' });
      }
    },
  }),
);

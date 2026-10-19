import type { ESTree, Rule } from '@oxlint/plugins';

import { argumentAt, defineEffectRule, isAnyApi, ruleMeta, type FileState, type FunctionNode } from '../../utils';
import { functionResult, promiseInitializer, promiseThunkArgument } from './utils';

function promiseThunk(node: ESTree.CallExpression, state: FileState): FunctionNode | undefined {
  if (!isAnyApi(node.callee, state, 'Effect', ['promise', 'tryPromise'])) {
    return undefined;
  }

  return promiseThunkArgument(argumentAt(node, 0));
}

export const noAlreadyStartedPromise: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Ensure Effect Promise thunks start fresh asynchronous work rather than reusing an already-started Promise.',
    {
      prestarted:
        'This thunk returns an already-started Promise. Start the asynchronous work inside the thunk so retries and repeats run it again.',
    },
    'https://github.com/Effect-TS/tsgo/issues/475',
  ),
  (context, getState) => {
    let prestartedPromises = new Set<string>();

    return {
      before() {
        prestartedPromises = new Set();
      },
      VariableDeclarator(node) {
        if (node.id.type === 'Identifier' && node.init && promiseInitializer(node.init)) {
          prestartedPromises.add(node.id.name);
        }
      },
      CallExpression(node) {
        const thunk = promiseThunk(node, getState());

        const result = thunk === undefined ? undefined : functionResult(thunk);

        if (result?.type === 'Identifier' && prestartedPromises.has(result.name)) {
          context.report({ node: result, messageId: 'prestarted' });
        }
      },
    };
  },
);

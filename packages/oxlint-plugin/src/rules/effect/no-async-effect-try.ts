import type { Rule } from '@oxlint/plugins';

import {
  argumentAt,
  defineEffectRule,
  isApi,
  isFunctionNode,
  objectProperty,
  ruleMeta,
  type FunctionNode,
} from '../../utils';
import { functionResult, promiseInitializer } from './utils';

export const noAsyncEffectTry: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow async thunks in Effect.try because rejected Promises bypass its catch mapper.',
    {
      asyncTry:
        'Effect.try does not await Promises. Use Effect.tryPromise so rejection enters the typed error channel.',
    },
    'https://github.com/Effect-TS/tsgo/issues/657',
  ),
  (context, getState) => ({
    CallExpression(node) {
      if (!isApi(node.callee, getState(), 'Effect', 'try')) {
        return;
      }

      const first = argumentAt(node, 0);
      let thunk: FunctionNode | undefined = first !== undefined && isFunctionNode(first) ? first : undefined;

      if (thunk === undefined && first?.type === 'ObjectExpression') {
        const tryValue = objectProperty(first, 'try')?.value;

        if (tryValue !== undefined && isFunctionNode(tryValue)) {
          thunk = tryValue;
        }
      }

      const result = thunk === undefined ? undefined : functionResult(thunk);

      if (thunk !== undefined && (thunk.async || (result !== undefined && promiseInitializer(result)))) {
        context.report({ node: thunk, messageId: 'asyncTry' });
      }
    },
  }),
);

import type { Rule } from '@oxlint/plugins';
import type * as Effect from 'effect/Effect';
import * as P from 'effect/Predicate';

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
      if (!isApi(node.callee, getState(), 'Effect', 'try' satisfies keyof typeof Effect)) {
        return;
      }

      const first = argumentAt(node, 0);

      let thunk: FunctionNode | undefined = P.isNotUndefined(first) && isFunctionNode(first) ? first : undefined;

      if (P.isUndefined(thunk) && first?.type === 'ObjectExpression') {
        const tryValue = objectProperty(first, 'try')?.value;

        if (P.isNotUndefined(tryValue) && isFunctionNode(tryValue)) {
          thunk = tryValue;
        }
      }

      const result = P.isUndefined(thunk) ? undefined : functionResult(thunk);

      if (P.isNotUndefined(thunk) && (thunk.async || (P.isNotUndefined(result) && promiseInitializer(result)))) {
        context.report({ node: thunk, messageId: 'asyncTry' });
      }
    },
  }),
);

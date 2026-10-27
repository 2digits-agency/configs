import type { Rule } from '@oxlint/plugins';
import type * as Effect from 'effect/Effect';

import { argumentAt, defineEffectRule, isAnyApi, isApi, ruleMeta, staticPath, unwrapExpression } from '../../utils';

// `either` is the Effect v3 name, which the current Effect types no longer export.
const wrapperMethods = ['option' satisfies keyof typeof Effect, 'either'];

export const noOptionOfService: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow wrapping infallible Effect.service access in Option or Either.',
    {
      mandatory:
        'Effect.service never fails, so this wrapper is always present and keeps the service requirement. Use Effect.serviceOption.',
    },
    'https://github.com/Effect-TS/tsgo/issues/648',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const state = getState();

      const wrapper = isAnyApi(node.callee, state, 'Effect', wrapperMethods);

      const wrapped = argumentAt(node, 0);

      if (
        wrapper &&
        wrapped?.type === 'CallExpression' &&
        isApi(wrapped.callee, state, 'Effect', 'service' satisfies keyof typeof Effect)
      ) {
        context.report({ node, messageId: 'mandatory' });

        return;
      }

      if (node.callee.type !== 'MemberExpression' || staticPath(node.callee)?.at(-1) !== 'pipe') {
        return;
      }

      const source = unwrapExpression(node.callee.object);

      const operator = argumentAt(node, 0);

      if (
        operator !== undefined &&
        source.type === 'CallExpression' &&
        isApi(source.callee, state, 'Effect', 'service' satisfies keyof typeof Effect) &&
        isAnyApi(operator, state, 'Effect', wrapperMethods)
      ) {
        context.report({ node, messageId: 'mandatory' });
      }
    },
  }),
);

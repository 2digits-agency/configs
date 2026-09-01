import type { Rule } from '@oxlint/plugins';

import { argumentAt, defineEffectRule, isApi, ruleMeta, staticPath, unwrapExpression } from '../../utils';

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
      const wrapper = isApi(node.callee, state, 'Effect', 'option') || isApi(node.callee, state, 'Effect', 'either');
      const wrapped = argumentAt(node, 0);

      if (wrapper && wrapped?.type === 'CallExpression' && isApi(wrapped.callee, state, 'Effect', 'service')) {
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
        isApi(source.callee, state, 'Effect', 'service') &&
        (isApi(operator, state, 'Effect', 'option') || isApi(operator, state, 'Effect', 'either'))
      ) {
        context.report({ node, messageId: 'mandatory' });
      }
    },
  }),
);

import type { Rule } from '@oxlint/plugins';

import { argumentAt, defineEffectRule, isApi, ruleMeta, staticPath, unwrapExpression } from '../../utils';

export const noServiceOptionGetOrThrow: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow turning missing Effect services into untyped Option defects.',
    {
      getOrThrow:
        'Option.getOrThrow after Effect.serviceOption hides a mandatory service until runtime. Use Effect.service so it remains a typed requirement.',
    },
    'https://github.com/Effect-TS/tsgo/issues/650',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const state = getState();

      if (isApi(node.callee, state, 'Option', 'getOrThrow') || isApi(node.callee, state, 'Option', 'getOrThrowWith')) {
        const option = argumentAt(node, 0);
        const yielded = option?.type === 'YieldExpression' ? option.argument : option;

        if (yielded?.type === 'CallExpression' && isApi(yielded.callee, state, 'Effect', 'serviceOption')) {
          context.report({ node, messageId: 'getOrThrow' });
        }

        return;
      }

      if (node.callee.type !== 'MemberExpression' || staticPath(node.callee)?.at(-1) !== 'pipe') {
        return;
      }

      const source = unwrapExpression(node.callee.object);
      const map = argumentAt(node, 0);

      if (
        source.type !== 'CallExpression' ||
        !isApi(source.callee, state, 'Effect', 'serviceOption') ||
        map?.type !== 'CallExpression' ||
        !isApi(map.callee, state, 'Effect', 'map')
      ) {
        return;
      }

      const mapper = argumentAt(map, 0);

      if (
        mapper !== undefined &&
        (isApi(mapper, state, 'Option', 'getOrThrow') || isApi(mapper, state, 'Option', 'getOrThrowWith'))
      ) {
        context.report({ node, messageId: 'getOrThrow' });
      }
    },
  }),
);

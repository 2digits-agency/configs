import type { Rule } from '@oxlint/plugins';
import type * as Effect from 'effect/Effect';
import type * as Opt from 'effect/Option';

import { argumentAt, defineEffectRule, isAnyApi, isApi, ruleMeta, staticPath, unwrapExpression } from '../../utils';

const getOrThrowMethods = ['getOrThrow', 'getOrThrowWith'] as const satisfies ReadonlyArray<keyof typeof Opt>;

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

      if (isAnyApi(node.callee, state, 'Option', getOrThrowMethods)) {
        const option = argumentAt(node, 0);

        const yielded = option?.type === 'YieldExpression' ? option.argument : option;

        if (
          yielded?.type === 'CallExpression' &&
          isApi(yielded.callee, state, 'Effect', 'serviceOption' satisfies keyof typeof Effect)
        ) {
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
        !isApi(source.callee, state, 'Effect', 'serviceOption' satisfies keyof typeof Effect) ||
        map?.type !== 'CallExpression' ||
        !isApi(map.callee, state, 'Effect', 'map' satisfies keyof typeof Effect)
      ) {
        return;
      }

      const mapper = argumentAt(map, 0);

      if (mapper !== undefined && isAnyApi(mapper, state, 'Option', getOrThrowMethods)) {
        context.report({ node, messageId: 'getOrThrow' });
      }
    },
  }),
);

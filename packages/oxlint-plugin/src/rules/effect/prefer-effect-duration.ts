import type { Rule } from '@oxlint/plugins';

import { argumentAt, canonicalPath, defineEffectRule, ruleMeta } from '../../utils';

const durationApis = new Set([
  'Effect.delay',
  'Effect.sleep',
  'Effect.timeout',
  'Effect.timeoutOption',
  'Effect.timeoutOrElse',
  'Schedule.fixed',
  'Schedule.spaced',
  'Schedule.windowed',
]);

export const preferEffectDuration: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer explicit Effect Duration constructors over ambiguous millisecond literals.',
    {
      effectDuration: 'Wrap this number with Duration.millis or use a more descriptive Duration constructor.',
    },
    'https://www.effect.website/docs/v4/api/effect/Duration',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const path = canonicalPath(node.callee, getState());

      if (path === undefined || !durationApis.has(path.join('.'))) {
        return;
      }

      const duration = argumentAt(node, node.arguments.length - 1);

      if (duration?.type === 'Literal' && typeof duration.value === 'number') {
        context.report({ node: duration, messageId: 'effectDuration' });
      }
    },
  }),
);

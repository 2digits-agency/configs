import type { Rule } from '@oxlint/plugins';

import { defineEffectRule, ruleMeta, staticPropertyName } from '../../utils';

const nativeDateFormattingMethods = new Set(['toISOString', 'toLocaleDateString', 'toLocaleTimeString']);

export const preferEffectDateTime: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer Effect DateTime formatting so time-zone behavior is explicit and composable.',
    {
      effectDateTime:
        'Convert to DateTime and format it in an explicit zone: DateTime.setZone with DateTime.formatIsoDate, formatIsoOffset or formatIsoZoned, or DateTime.format with timeZone. DateTime.formatIso is UTC, like toISOString: use it only for UTC instants, never slice it for a local date.',
    },
    'https://www.effect.website/docs/v4/api/effect/DateTime',
  ),
  (context, getState) => ({
    CallExpression(node) {
      if (
        getState().hasEffectImport &&
        node.callee.type === 'MemberExpression' &&
        nativeDateFormattingMethods.has(staticPropertyName(node.callee) ?? '')
      ) {
        context.report({ node, messageId: 'effectDateTime' });
      }
    },
  }),
);

import type { Rule } from '@oxlint/plugins';

import { namespaceImport } from '../../fixes';
import { defineEffectRule, ruleMeta } from '../../utils';
import { durationArgument, numericValue } from './duration';

export const preferEffectDuration: Rule = defineEffectRule(
  {
    ...ruleMeta(
      'suggestion',
      'Prefer explicit Effect Duration constructors over ambiguous millisecond literals.',
      {
        effectDuration: 'Wrap this number with Duration.millis or use a more descriptive Duration constructor.',
      },
      'https://www.effect.website/docs/v4/api/effect/Duration',
    ),
    fixable: 'code',
  },
  (context, getState) => ({
    CallExpression(node) {
      const duration = durationArgument(node, context, getState());

      if (duration === undefined || numericValue(duration) === undefined) {
        return;
      }

      context.report({
        node: duration,
        messageId: 'effectDuration',
        fix(fixer) {
          const imported = namespaceImport(context, node, 'effect/Duration', 'Duration', fixer);

          return [
            ...imported.fixes,
            fixer.replaceText(duration, `${imported.name}.millis(${context.sourceCode.getText(duration)})`),
          ];
        },
      });
    },
  }),
);

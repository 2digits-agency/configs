import type { Rule } from '@oxlint/plugins';

import { defineSyntaxRule, propertyName, ruleMeta } from '../../utils';
import { isMatchPatternObject, isStringLiteral } from './tagged-values';

/**
 * Prefer constructors to literal tagged objects, excluding direct Match patterns.
 */
export const noManualTaggedConstruction: Rule = defineSyntaxRule(
  ruleMeta(
    'problem',
    'Construct tagged values with their existing Effect constructor instead of writing `_tag` manually.',
    {
      manualConstruction:
        'Use the existing Schema tagged `.make`, tagged class/error constructor, or Data.taggedEnum variant constructor instead of writing a literal `_tag` object.',
    },
    'https://github.com/dmmulroy/anti-slop/blob/main/src/effect/rules/no-manual-tagged-construction.ts',
  ),
  (context) => ({
    ObjectExpression(node) {
      if (isMatchPatternObject(node)) {
        return;
      }

      const tag = node.properties.find(
        (property) =>
          property.type === 'Property' && propertyName(property) === '_tag' && isStringLiteral(property.value),
      );

      if (tag !== undefined) {
        context.report({ node: tag, messageId: 'manualConstruction' });
      }
    },
  }),
);

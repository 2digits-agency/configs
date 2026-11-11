import { Diagnostic, RuleContext, Visitor, type CreateRule } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { isStringLiteral, propertyName } from '../../internal/ast';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';
import { isMatchPatternObject } from './internal/tagged-values';

/**
 * Prefer constructors to literal tagged objects, excluding direct Match patterns.
 */
export const noManualTaggedConstruction: CreateRule = defineRule({
  name: 'no-manual-tagged-construction',
  meta: ruleMeta({
    type: 'problem',
    description: 'Construct tagged values with their existing Effect constructor instead of writing `_tag` manually.',
    messages: {
      manualConstruction:
        'Use the existing Schema tagged `.make`, tagged class/error constructor, or Data.taggedEnum variant constructor instead of writing a literal `_tag` object.',
    },
    url: 'https://github.com/dmmulroy/anti-slop/blob/main/src/effect/rules/no-manual-tagged-construction.ts',
  }),
  *create() {
    const ctx = yield* RuleContext;

    return Visitor.on('ObjectExpression', (node) =>
      isMatchPatternObject(node)
        ? Effect.void
        : Opt.match(
            Arr.findFirst(
              node.properties,
              (property) =>
                property.type === 'Property' &&
                Opt.contains(propertyName(property), '_tag') &&
                isStringLiteral(property.value),
            ),
            {
              onNone: () => Effect.void,
              onSome: (tag) => ctx.report(Diagnostic.fromId({ node: tag, messageId: 'manualConstruction' })),
            },
          ),
    );
  },
});

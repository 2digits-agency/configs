import type { ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as Opt from 'effect/Option';

import { defineEffectRule, propertyName, ruleMeta } from '../../utils';

export const noOverwrittenDiscriminant: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Ensure a later object spread cannot overwrite an explicitly assigned _tag.',
    { overwritten: 'A later spread can overwrite _tag at runtime. Move _tag after all spreads.' },
    'https://github.com/Effect-TS/tsgo/issues/426',
  ),
  (context) => ({
    ObjectExpression(node) {
      const tag = Arr.findFirstWithIndex(
        node.properties,
        (property): property is ESTree.ObjectProperty =>
          property.type === 'Property' && propertyName(property) === '_tag',
      );

      if (Opt.isNone(tag)) {
        return;
      }

      const [property, index] = tag.value;

      if (Arr.some(Arr.drop(node.properties, index + 1), (later) => later.type === 'SpreadElement')) {
        context.report({ node: property, messageId: 'overwritten' });
      }
    },
  }),
);

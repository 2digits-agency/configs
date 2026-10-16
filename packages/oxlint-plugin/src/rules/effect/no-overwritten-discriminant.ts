import type { Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as Fn from 'effect/Function';
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
      const tagIndex = Opt.getOrElse(
        Fn.pipe(
          node.properties,
          Arr.findFirstIndex((property) => property.type === 'Property' && propertyName(property) === '_tag'),
        ),
        () => -1,
      );

      if (tagIndex === -1) {
        return;
      }

      const laterSpread = Fn.pipe(
        node.properties.slice(tagIndex + 1),
        Arr.some((property) => property.type === 'SpreadElement'),
      );

      const tag = node.properties[tagIndex];

      if (laterSpread && tag?.type === 'Property') {
        context.report({ node: tag, messageId: 'overwritten' });
      }
    },
  }),
);

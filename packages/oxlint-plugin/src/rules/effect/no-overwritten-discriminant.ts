import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { propertyName } from '../../internal/ast';
import { ruleMeta } from '../../internal/meta';

export const noOverwrittenDiscriminant = Rule.define({
  name: 'no-overwritten-discriminant',
  meta: ruleMeta({
    type: 'problem',
    description: 'Ensure a later object spread cannot overwrite an explicitly assigned _tag.',
    messages: { overwritten: 'A later spread can overwrite _tag at runtime. Move _tag after all spreads.' },
    url: 'https://github.com/Effect-TS/tsgo/issues/426',
  }),
  *create() {
    const ctx = yield* RuleContext;

    return Visitor.on('ObjectExpression', (node) =>
      Arr.findFirstWithIndex(
        node.properties,
        (property): property is ESTree.ObjectProperty =>
          property.type === 'Property' && Opt.contains(propertyName(property), '_tag'),
      ).pipe(
        Opt.filter(([, index]) =>
          Arr.some(Arr.drop(node.properties, index + 1), (later) => later.type === 'SpreadElement'),
        ),
        Opt.match({
          onNone: () => Effect.void,
          onSome: ([property]) => ctx.report(Diagnostic.fromId({ node: property, messageId: 'overwritten' })),
        }),
      ),
    );
  },
});

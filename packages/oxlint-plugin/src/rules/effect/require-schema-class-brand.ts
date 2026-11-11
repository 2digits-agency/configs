import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import type * as Schema from 'effect/Schema';

import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

export const requireSchemaClassBrand = Rule.define({
  name: 'require-schema-class-brand',
  meta: ruleMeta({
    type: 'problem',
    description: 'Require Schema.Class declarations to carry a nominal brand.',
    messages: {
      missingBrand:
        'Schema.Class without a second type parameter is structural. Add a unique brand so plain objects cannot masquerade as instances.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/468',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      imports.isApi(node.callee, 'Schema', 'Class' satisfies keyof typeof Schema) &&
      (node.typeArguments?.params.length ?? 0) < 2
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'missingBrand' }))
        : Effect.void,
    );
  },
});

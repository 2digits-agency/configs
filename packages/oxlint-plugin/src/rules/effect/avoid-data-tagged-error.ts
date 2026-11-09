import { Diagnostic, RuleContext, Visitor, type CreateRule } from 'effect-oxlint';
import type * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';

import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';

export const avoidDataTaggedError: CreateRule = defineRule({
  name: 'avoid-data-tagged-error',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer schema-based tagged errors so errors have a serializable contract.',
    messages: { taggedError: 'Prefer Schema.TaggedError over Data.TaggedError.' },
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      imports.isApi(node.callee, 'Data', 'TaggedError' satisfies keyof typeof Data)
        ? ctx.report(Diagnostic.fromId({ node: node.callee, messageId: 'taggedError' }))
        : Effect.void,
    );
  },
});

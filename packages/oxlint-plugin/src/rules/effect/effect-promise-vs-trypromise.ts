import { Diagnostic, RuleContext, Visitor, type CreateRule } from 'effect-oxlint';
import * as Effect from 'effect/Effect';

import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';

export const effectPromiseVsTryPromise: CreateRule = defineRule({
  name: 'effect-promise-vs-trypromise',
  meta: ruleMeta({
    type: 'problem',
    description: 'Require Effect.tryPromise so Promise rejections enter the typed error channel.',
    messages: { tryPromise: 'Use Effect.tryPromise instead of Effect.promise so rejections are typed failures.' },
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      imports.isApi(node.callee, 'Effect', 'promise' satisfies keyof typeof Effect)
        ? ctx.report(Diagnostic.fromId({ node: node.callee, messageId: 'tryPromise' }))
        : Effect.void,
    );
  },
});

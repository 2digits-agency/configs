import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { ruleMeta } from '../../internal/meta';

// Anything that reads like `use client`, `use server` or `use cache`, in any case or spacing.
const isDirectiveLike = Schema.is(Schema.String.check(Schema.isPattern(/^\s*use[\s_-]*(?:client|server|cache)\b/iu)));

const isExactDirective = Schema.is(
  Schema.String.check(Schema.isPattern(/^use (?:client|server|cache(?:: [\w-]+)?)$/u)),
);

export const validDirective = Rule.define({
  name: 'valid-directive',
  meta: ruleMeta({
    type: 'problem',
    description: "Disallow misspelled 'use client', 'use server' and 'use cache' directives, which do nothing.",
    messages: {
      invalidDirective:
        "'{{directive}}' is not a valid directive, so it does nothing. Directives are case- and whitespace-sensitive: write 'use client', 'use server' or 'use cache'.",
    },
    url: 'https://react.dev/reference/rsc/directives',
  }),
  *create() {
    const ctx = yield* RuleContext;

    return Visitor.on('ExpressionStatement', (node) =>
      Opt.liftPredicate(node.directive, Str.isString).pipe(
        Opt.filter((directive) => !isExactDirective(directive) && isDirectiveLike(directive)),
        Opt.match({
          onNone: () => Effect.void,
          onSome: (directive) =>
            ctx.report(Diagnostic.fromId({ node, messageId: 'invalidDirective', data: { directive } })),
        }),
      ),
    );
  },
});

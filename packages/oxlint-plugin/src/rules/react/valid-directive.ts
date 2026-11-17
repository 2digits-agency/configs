import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { ruleMeta } from '../../internal/meta';
import { DirectiveLike, ExactDirective } from '../../schemas/platform';

const isDirectiveLike = Schema.is(DirectiveLike);

const isExactDirective = Schema.is(ExactDirective);

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

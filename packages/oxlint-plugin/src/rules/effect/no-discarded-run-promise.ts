import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';
import * as Effect from 'effect/Effect';

import { isDiscarded } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

export const noDiscardedRunPromise = Rule.define({
  name: 'no-discarded-run-promise',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow discarded Effect.runPromise results that can become unhandled rejections.',
    messages: {
      discarded:
        'The Promise returned by Effect.runPromise is discarded. Await/return/handle it, or use Effect.runFork for fire-and-forget work.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/643',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    function isRunPromise(callee: Parameters<typeof imports.isApi>[0]) {
      return (
        imports.isApi(callee, 'Effect', 'runPromise' satisfies keyof typeof Effect) ||
        (callee.type === 'CallExpression' &&
          imports.isApi(callee.callee, 'Effect', 'runPromiseWith' satisfies keyof typeof Effect))
      );
    }

    return Visitor.on('CallExpression', (node) =>
      isRunPromise(node.callee) && isDiscarded(node)
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'discarded' }))
        : Effect.void,
    );
  },
});

import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { isLiteral, objectArgument, objectProperty } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

export const noZeroRetryTimes = Rule.define({
  name: 'no-zero-retry-times',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow no-op retry and repeat wrappers with times: 0.',
    messages: { zeroTimes: 'times: 0 performs no retries or repeats. Remove the wrapper or use a positive count.' },
    url: 'https://github.com/Effect-TS/tsgo/issues/412',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      imports.isApi(node.callee, 'Effect', ['retry', 'repeat'] satisfies ReadonlyArray<keyof typeof Effect>)
        ? objectArgument(node).pipe(
            Opt.flatMap(objectProperty('times')),
            Opt.filter((times) => isLiteral(times.value, 0)),
            Opt.match({
              onNone: () => Effect.void,
              onSome: (times) => ctx.report(Diagnostic.fromId({ node: times, messageId: 'zeroTimes' })),
            }),
          )
        : Effect.void,
    );
  },
});

import { Diagnostic, RuleContext, Visitor, type CreateRule } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { isLiteral, objectArgument, objectProperty } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';

export const noZeroRetryTimes: CreateRule = defineRule({
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
        ? Opt.match(
            Opt.filter(
              Opt.flatMap(objectArgument(node), (options) => objectProperty(options, 'times')),
              (times) => isLiteral(times.value, 0),
            ),
            {
              onNone: () => Effect.void,
              onSome: (times) => ctx.report(Diagnostic.fromId({ node: times, messageId: 'zeroTimes' })),
            },
          )
        : Effect.void,
    );
  },
});

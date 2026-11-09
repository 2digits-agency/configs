import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { argumentAt, isLiteral, objectProperty } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

export const alchemyNoReservedEventbridgeDefaultName: CreateRule = Rule.define({
  name: 'alchemy-no-reserved-eventbridge-default-name',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow creating an EventBridge bus with the reserved default name.',
    messages: {
      reserved:
        'EventBridge reserves the name "default". Omit the bus argument to use the account default, or choose another name.',
    },
    url: 'https://alchemy.run/aws/messaging/eventbridge',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      Opt.match(
        argumentAt(node, 1).pipe(
          Opt.filter(() => imports.isApiPath(node.callee, ['AWS', 'EventBridge', 'EventBus'])),
          Opt.filter((options): options is ESTree.ObjectExpression => options.type === 'ObjectExpression'),
          Opt.flatMap((options) => objectProperty(options, 'name')),
          Opt.map(({ value }) => value),
          Opt.filter((name) => isLiteral(name, 'default')),
        ),
        {
          onNone: () => Effect.void,
          onSome: (name) => ctx.report(Diagnostic.fromId({ node: name, messageId: 'reserved' })),
        },
      ),
    );
  },
});

import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import { argumentAt, isStringLiteral } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { type DomainBlock, FieldChangeCommandName, FieldChangeEventName } from '../../schemas/alchemy';
import { domainBlock, type DomainFile } from './internal/domain';

const isFieldChangeEvent = Schema.is(FieldChangeEventName);

const isFieldChangeCommand = Schema.is(FieldChangeCommandName);

function fieldChange(block: DomainBlock, name: string): Opt.Option<'event' | 'command'> {
  if (block === 'Event' && isFieldChangeEvent(name)) {
    return Opt.some('event');
  }

  return block === 'Command' && isFieldChangeCommand(name) ? Opt.some('command') : Opt.none();
}

export const alchemyDomainEventName = Rule.define({
  name: 'alchemy-domain-event-name',
  meta: ruleMeta({
    type: 'suggestion',
    description:
      'Disallow Alchemy Domain events and commands named after a field change, such as `BalanceSet` or `UpdatePrices`.',
    messages: {
      event:
        'Name the business fact `{{name}}` records, not the field that changed: `MoneyWithdrawn`, not `BalanceChanged`.',
      command: 'Name what `{{name}}` asks the domain to do, not the field it sets: `WithdrawMoney`, not `SetBalance`.',
    },
    url: 'https://alchemy.run/domain/model',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const file: DomainFile = { sourceCode: ctx.sourceCode, imports: yield* importBindings };

    return Visitor.on('CallExpression', (node) =>
      Opt.all({ block: domainBlock(node, file), tag: Opt.filter(argumentAt(node, 0), isStringLiteral) }).pipe(
        Opt.flatMap(({ block, tag }) =>
          Opt.map(fieldChange(block, tag.value), (messageId) =>
            Diagnostic.fromId({ node: tag, messageId, data: { name: tag.value } }),
          ),
        ),
        Opt.match({ onNone: () => Effect.void, onSome: (diagnostic) => ctx.report(diagnostic) }),
      ),
    );
  },
});

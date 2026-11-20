import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { argumentAt, objectProperty, unwrapExpression } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { ApiMemberKind } from '../../schemas/alchemy';
import { domainBlock, type DomainFile } from './internal/domain';

export const alchemyDomainApiExplicitMembers = Rule.define({
  name: 'alchemy-domain-api-explicit-members',
  meta: ruleMeta({
    type: 'problem',
    description: 'Require Alchemy Domain Apis to list the commands, views, streams and queries they serve.',
    messages: {
      missing:
        'List {{kinds}} on this Api, `[]` for none. A kind it leaves out is served whole, including what the model gains later.',
    },
    url: 'https://alchemy.run/domain/api',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const file: DomainFile = { sourceCode: ctx.sourceCode, imports: yield* importBindings };

    return Visitor.on('CallExpression', (node) =>
      argumentAt(node, 1).pipe(
        Opt.map(unwrapExpression),
        Opt.filter((options): options is ESTree.ObjectExpression => options.type === 'ObjectExpression'),
        // A spread may list the missing kinds.
        Opt.filter((options) => !Arr.some(options.properties, (property) => property.type === 'SpreadElement')),
        Opt.filter(() => Opt.contains(domainBlock(node, file), 'Api')),
        Opt.map((options) => Arr.filter(ApiMemberKind.literals, (kind) => Opt.isNone(objectProperty(options, kind)))),
        Opt.filter(Arr.isReadonlyArrayNonEmpty<typeof ApiMemberKind.Type>),
        Opt.match({
          onNone: () => Effect.void,
          onSome: (missing) =>
            ctx.report(
              Diagnostic.fromId({
                node: node.callee,
                messageId: 'missing',
                data: {
                  kinds: Arr.join(
                    Arr.map(missing, (kind) => `\`${kind}\``),
                    ', ',
                  ),
                },
              }),
            ),
        }),
      ),
    );
  },
});

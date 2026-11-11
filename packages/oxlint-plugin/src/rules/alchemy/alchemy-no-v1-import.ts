import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';

import { ruleMeta } from '../../internal/meta';

const providerEntrypoints: Readonly<Record<string, string>> = {
  'alchemy/aws': 'alchemy/AWS',
  'alchemy/cloudflare': 'alchemy/Cloudflare',
};

export const alchemyNoV1Import = Rule.define({
  name: 'alchemy-no-v1-import',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow Alchemy v1 imports that bypass the Effect-based Stack API.',
    messages: {
      defaultImport: 'The default alchemy() API is from v1. Use import * as Alchemy and Alchemy.Stack.',
      providerImport: 'Use the v2 provider entrypoint {{replacement}} (capitalization is significant).',
    },
    url: 'https://alchemy.run/migrating-from-v1',
  }),
  *create() {
    const ctx = yield* RuleContext;

    function report(node: ESTree.Node, messageId: 'defaultImport' | 'providerImport', data?: Record<string, string>) {
      return ctx.report(Diagnostic.fromId({ node, messageId, ...(P.isUndefined(data) ? {} : { data }) }));
    }

    return Visitor.on('ImportDeclaration', (node) => {
      const source = node.source.value;

      const found =
        source === 'alchemy'
          ? Opt.map(
              Arr.findFirst(node.specifiers, (specifier) => specifier.type === 'ImportDefaultSpecifier'),
              (specifier) => report(specifier, 'defaultImport'),
            )
          : Opt.map(R.get(providerEntrypoints, source), (replacement) =>
              report(node.source, 'providerImport', { replacement }),
            );

      return Opt.getOrElse(found, () => Effect.void);
    });
  },
});

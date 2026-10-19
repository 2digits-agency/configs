import type { Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as Opt from 'effect/Option';

import { defineSyntaxRule, ruleMeta } from '../../utils';

const providerEntrypoints: ReadonlyMap<string, string> = new Map([
  ['alchemy/aws', 'alchemy/AWS'],
  ['alchemy/cloudflare', 'alchemy/Cloudflare'],
]);

export const alchemyNoV1Import: Rule = defineSyntaxRule(
  ruleMeta(
    'problem',
    'Disallow Alchemy v1 imports that bypass the Effect-based Stack API.',
    {
      defaultImport: 'The default alchemy() API is from v1. Use import * as Alchemy and Alchemy.Stack.',
      providerImport: 'Use the v2 provider entrypoint {{replacement}} (capitalization is significant).',
    },
    'https://alchemy.run/migrating-from-v1',
  ),
  (context) => ({
    ImportDeclaration(node) {
      const source = node.source.value;

      if (source === 'alchemy') {
        const defaultImport = Opt.getOrUndefined(
          Arr.findFirst(node.specifiers, (specifier) => specifier.type === 'ImportDefaultSpecifier'),
        );

        if (defaultImport !== undefined) {
          context.report({ node: defaultImport, messageId: 'defaultImport' });
        }

        return;
      }

      const replacement = providerEntrypoints.get(source);

      if (replacement === undefined) {
        return;
      }

      context.report({ node: node.source, messageId: 'providerImport', data: { replacement } });
    },
  }),
);

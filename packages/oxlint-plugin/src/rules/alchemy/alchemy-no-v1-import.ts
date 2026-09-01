import type { Rule } from '@oxlint/plugins';

import { defineSyntaxRule, ruleMeta } from '../../utils';

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
        const defaultImport = node.specifiers.find((specifier) => specifier.type === 'ImportDefaultSpecifier');

        if (defaultImport !== undefined) {
          context.report({ node: defaultImport, messageId: 'defaultImport' });
        }

        return;
      }

      const provider = /^alchemy\/(aws|cloudflare)$/.exec(source)?.[1];

      if (provider !== undefined) {
        const replacement = `alchemy/${provider === 'aws' ? 'AWS' : 'Cloudflare'}`;

        context.report({ node: node.source, messageId: 'providerImport', data: { replacement } });
      }
    },
  }),
);

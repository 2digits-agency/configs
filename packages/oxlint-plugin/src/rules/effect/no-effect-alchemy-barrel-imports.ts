import type { Rule } from '@oxlint/plugins';

import { defineSyntaxRule, moduleExportName, ruleMeta } from '../../utils';
import { fixBarrel } from './import-fixes';
import { barrelModuleSource, isTypeOnlyImport, namespaceAlias } from './import-style-utils';

export const noEffectAlchemyBarrelImports: Rule = defineSyntaxRule(
  {
    ...ruleMeta(
      'suggestion',
      'Import Effect and Alchemy module namespaces from their submodule entrypoints instead of root barrels.',
      {
        barrelImport:
          'Import this module as `import * as {{alias}} from "{{source}}"` instead of from the root barrel.',
      },
      'https://github.com/Effect-TS/language-service/blob/main/packages/language-service/src/diagnostics/importFromBarrel.ts',
    ),
    fixable: 'code',
  },
  (context) => ({
    ImportDeclaration(node) {
      for (const specifier of node.specifiers) {
        if (specifier.type !== 'ImportSpecifier' || isTypeOnlyImport(node, specifier)) {
          continue;
        }

        const name = moduleExportName(specifier.imported);

        const source = /^\p{Lu}/u.test(name) ? barrelModuleSource(node.source.value, name) : undefined;

        if (source !== undefined) {
          context.report({
            node: specifier,
            messageId: 'barrelImport',
            data: { alias: namespaceAlias(name), source },
            fix: (fixer) => fixBarrel(context, node, fixer),
          });
        }
      }
    },
  }),
);

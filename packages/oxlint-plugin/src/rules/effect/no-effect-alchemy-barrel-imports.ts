import type { Rule } from '@oxlint/plugins';

import { defineSyntaxRule, ruleMeta } from '../../utils';
import { barrelModuleSource, isTypeOnlyImport, namespaceAlias } from './import-style-utils';

function importedName(specifier: Parameters<typeof isTypeOnlyImport>[1]): string | undefined {
  if (specifier?.imported.type === 'Identifier') {
    return specifier.imported.name;
  }

  return typeof specifier?.imported.value === 'string' ? specifier.imported.value : undefined;
}

export const noEffectAlchemyBarrelImports: Rule = defineSyntaxRule(
  ruleMeta(
    'suggestion',
    'Import Effect and Alchemy module namespaces from their submodule entrypoints instead of root barrels.',
    {
      barrelImport: 'Import this module as `import * as {{alias}} from "{{source}}"` instead of from the root barrel.',
    },
    'https://github.com/Effect-TS/language-service/blob/main/packages/language-service/src/diagnostics/importFromBarrel.ts',
  ),
  (context) => ({
    ImportDeclaration(node) {
      for (const specifier of node.specifiers) {
        if (specifier.type !== 'ImportSpecifier' || isTypeOnlyImport(node, specifier)) {
          continue;
        }

        const name = importedName(specifier);
        const source =
          name === undefined || !/^\p{Lu}/u.test(name) ? undefined : barrelModuleSource(node.source.value, name);

        if (name !== undefined && source !== undefined) {
          context.report({
            node: specifier,
            messageId: 'barrelImport',
            data: { alias: namespaceAlias(name), source },
          });
        }
      }
    },
  }),
);

import type { Rule } from '@oxlint/plugins';

import { defineSyntaxRule, ruleMeta } from '../../utils';
import { isTypeOnlyImport, namespaceAlias, submoduleName } from './import-style-utils';

export const preferEffectAlchemyNamespaceImports: Rule = defineSyntaxRule(
  ruleMeta(
    'suggestion',
    'Use consistently aliased namespace imports for Effect and Alchemy submodule entrypoints.',
    {
      alias: 'Import {{source}} as the canonical namespace alias `{{alias}}`.',
      namespace: 'Use `import * as {{alias}} from "{{source}}"` instead of importing values directly.',
    },
    'https://github.com/Effect-TS/language-service/blob/main/packages/language-service/src/core/AutoImport.ts',
  ),
  (context) => ({
    ImportDeclaration(node) {
      const moduleName = submoduleName(node.source.value);

      if (moduleName === undefined || node.importKind === 'type') {
        return;
      }

      const alias = namespaceAlias(moduleName);

      for (const specifier of node.specifiers) {
        if (specifier.type === 'ImportSpecifier' && isTypeOnlyImport(node, specifier)) {
          continue;
        }

        if (specifier.type === 'ImportNamespaceSpecifier') {
          if (specifier.local.name !== alias) {
            context.report({
              node: specifier.local,
              messageId: 'alias',
              data: { alias, source: node.source.value },
            });
          }

          continue;
        }

        context.report({
          node: specifier,
          messageId: 'namespace',
          data: { alias, source: node.source.value },
        });
      }
    },
  }),
);

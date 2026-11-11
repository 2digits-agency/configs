import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { moduleExportName } from '../../internal/ast';
import { withOptionalFix } from '../../internal/fixes';
import { ruleMeta } from '../../internal/meta';
import { barrelFix } from './internal/import-fixes';
import { barrelModuleSource, isModuleName, isTypeOnlyImport, namespaceAlias } from './internal/import-style';

export const noEffectAlchemyBarrelImports = Rule.define({
  name: 'no-effect-alchemy-barrel-imports',
  meta: ruleMeta({
    type: 'suggestion',
    description:
      'Import Effect and Alchemy module namespaces from their submodule entrypoints instead of root barrels.',
    messages: {
      barrelImport: 'Import this module as `import * as {{alias}} from "{{source}}"` instead of from the root barrel.',
    },
    url: 'https://github.com/Effect-TS/language-service/blob/main/packages/language-service/src/diagnostics/importFromBarrel.ts',
    fixable: 'code',
  }),
  *create() {
    const ctx = yield* RuleContext;

    function reportSpecifier(node: ESTree.ImportDeclaration, specifier: ESTree.ImportSpecifier) {
      const name = moduleExportName(specifier.imported);

      return Opt.match(isModuleName(name) ? barrelModuleSource(node.source.value, name) : Opt.none(), {
        onNone: () => Effect.void,
        onSome: (source) =>
          ctx.report(
            withOptionalFix(
              Diagnostic.fromId({
                node: specifier,
                messageId: 'barrelImport',
                data: { alias: namespaceAlias(name), source },
              }),
              barrelFix(ctx.sourceCode, node),
            ),
          ),
      });
    }

    return Visitor.on('ImportDeclaration', (node) =>
      // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
      Effect.forEach(
        Arr.filter(
          node.specifiers,
          (specifier): specifier is ESTree.ImportSpecifier =>
            specifier.type === 'ImportSpecifier' && !isTypeOnlyImport(node, specifier),
        ),
        (specifier) => reportSpecifier(node, specifier),
        { discard: true },
      ),
    );
  },
});

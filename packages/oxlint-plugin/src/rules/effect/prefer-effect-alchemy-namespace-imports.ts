import { Diagnostic, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { withOptionalFix } from '../../internal/fixes';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';
import { namespaceFix } from './internal/import-fixes';
import { isTypeOnlyImport, namespaceAlias, submoduleName } from './internal/import-style';

export const preferEffectAlchemyNamespaceImports: CreateRule = defineRule({
  name: 'prefer-effect-alchemy-namespace-imports',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Use consistently aliased namespace imports for Effect and Alchemy submodule entrypoints.',
    messages: {
      alias: 'Import {{source}} as the canonical namespace alias `{{alias}}`.',
      namespace: 'Use `import * as {{alias}} from "{{source}}"` instead of importing values directly.',
    },
    url: 'https://github.com/Effect-TS/language-service/blob/main/packages/language-service/src/core/AutoImport.ts',
    fixable: 'code',
  }),
  *create() {
    const ctx = yield* RuleContext;

    /**
     * Report a namespace import under another alias, and every named or default value import.
     *
     * @param node Import of a submodule entrypoint.
     * @param alias Canonical namespace alias.
     */
    function reportImport(node: ESTree.ImportDeclaration, alias: string) {
      const data = { alias, source: node.source.value };

      function report(target: ESTree.Node, messageId: 'alias' | 'namespace') {
        return ctx.report(
          withOptionalFix(Diagnostic.fromId({ node: target, messageId, data }), namespaceFix(ctx.sourceCode, node)),
        );
      }

      // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
      return Effect.forEach(
        Arr.filter(
          node.specifiers,
          (specifier) => specifier.type !== 'ImportSpecifier' || !isTypeOnlyImport(node, specifier),
        ),
        (specifier) =>
          specifier.type === 'ImportNamespaceSpecifier'
            ? specifier.local.name === alias
              ? Effect.void
              : report(specifier.local, 'alias')
            : report(specifier, 'namespace'),
        { discard: true },
      );
    }

    return Visitor.on('ImportDeclaration', (node) =>
      Opt.match(
        Opt.filter(submoduleName(node.source.value), () => node.importKind !== 'type'),
        {
          onNone: () => Effect.void,
          onSome: (moduleName) => reportImport(node, namespaceAlias(moduleName)),
        },
      ),
    );
  },
});

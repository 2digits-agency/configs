import type { ESTree, Rule } from '@oxlint/plugins';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';

import { defineSyntaxRule, ruleMeta } from '../../utils';

const serviceConstructorName = /^make[A-Z]/u;

const importedName = Match.type<ESTree.ModuleExportName>().pipe(
  Match.when({ type: 'Identifier' }, (imported) => imported.name),
  Match.when({ value: Match.nonEmptyString }, (imported) => imported.value),
  Match.orElse(Fn.constUndefined),
);

const testFile = /\.(?:test|spec)\.[cm]?[jt]sx?$/u;

/**
 * Keep relative make<Capability> imports in tests, not runtime composition.
 */
export const noServiceConstructorImports: Rule = defineSyntaxRule(
  ruleMeta(
    'problem',
    'Disallow project-local make<CapabilityName> imports outside test and spec files.',
    {
      serviceConstructorImport:
        'Do not import Effect service constructor "{{name}}" into runtime code. Import the owning Layer, yield the contextual service, and allow its requirements to propagate to the composition root.',
    },
    'https://github.com/dmmulroy/anti-slop/blob/main/src/effect/rules/no-service-constructor-imports.ts',
  ),
  (context) => ({
    ImportDeclaration(node) {
      // CreateOnce is reused across files: inspect the current filename on each visit.
      if (testFile.test(context.filename.replaceAll('\\', '/'))) {
        return;
      }

      if (!node.source.value.startsWith('./') && !node.source.value.startsWith('../')) {
        return;
      }

      for (const specifier of node.specifiers) {
        if (specifier.type !== 'ImportSpecifier') {
          continue;
        }

        const name = importedName(specifier.imported);

        if (name !== undefined && serviceConstructorName.test(name)) {
          context.report({ node: specifier, messageId: 'serviceConstructorImport', data: { name } });
        }
      }
    },
  }),
);

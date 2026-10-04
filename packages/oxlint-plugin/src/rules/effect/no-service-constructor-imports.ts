import type { Rule } from '@oxlint/plugins';

import { defineSyntaxRule, ruleMeta } from '../../utils';

const serviceConstructorName = /^make[A-Z]/u;

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

        const name = specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value;

        if (serviceConstructorName.test(name)) {
          context.report({ node: specifier, messageId: 'serviceConstructorImport', data: { name } });
        }
      }
    },
  }),
);

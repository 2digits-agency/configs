import { Diagnostic, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { moduleExportName } from '../../internal/ast';
import { isTestFilename } from '../../internal/files';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';

const isServiceConstructorName = Schema.is(Schema.String.check(Schema.isPattern(/^make[A-Z]/u)));

const isRelativeSource = Schema.is(Schema.String.check(Schema.isPattern(/^\.\.?\//u)));

/**
 * Keep relative make<Capability> imports in tests, not runtime composition.
 */
export const noServiceConstructorImports: CreateRule = defineRule({
  name: 'no-service-constructor-imports',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow project-local make<CapabilityName> imports outside test and spec files.',
    messages: {
      serviceConstructorImport:
        'Do not import Effect service constructor "{{name}}" into runtime code. Import the owning Layer, yield the contextual service, and allow its requirements to propagate to the composition root.',
    },
    url: 'https://github.com/dmmulroy/anti-slop/blob/main/src/effect/rules/no-service-constructor-imports.ts',
  }),
  *create() {
    const ctx = yield* RuleContext;

    if (isTestFilename(Str.replaceAll('\\', '/')(ctx.filename))) {
      return {};
    }

    return Visitor.on('ImportDeclaration', (node) =>
      isRelativeSource(node.source.value)
        ? // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
          Effect.forEach(
            Arr.filter(
              node.specifiers,
              (specifier): specifier is ESTree.ImportSpecifier => specifier.type === 'ImportSpecifier',
            ),
            (specifier) => {
              const name = moduleExportName(specifier.imported);

              return isServiceConstructorName(name)
                ? ctx.report(
                    Diagnostic.fromId({ node: specifier, messageId: 'serviceConstructorImport', data: { name } }),
                  )
                : Effect.void;
            },
            { discard: true },
          )
        : Effect.void,
    );
  },
});

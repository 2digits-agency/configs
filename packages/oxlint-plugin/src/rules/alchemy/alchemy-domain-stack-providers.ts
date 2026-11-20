import { Diagnostic, Rule, RuleContext, Visitor, type ESTree, type OxlintSourceCode } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { argumentAt, namespaceMember, objectProperty, unwrapExpression, walkNodes } from '../../internal/ast';
import { importBindings, moduleImportMember } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { StackFilename } from '../../schemas/alchemy';
import { importedPath, type DomainFile } from './internal/domain';

const isStackFilename = Schema.is(StackFilename);

/**
 * Whether `providers` calls the `providers()` export of one of `sources`.
 *
 * @param sourceCode Source of the file.
 * @param providers Value of the Stack's `providers` option.
 * @param sources Module specifiers.
 */
function callsProviders(sourceCode: OxlintSourceCode, providers: ESTree.Node, sources: ReadonlyArray<string>): boolean {
  return walkNodes(
    providers,
    (node) =>
      node.type === 'CallExpression' && Opt.contains(moduleImportMember(sourceCode, node.callee, sources), 'providers'),
  );
}

export const alchemyDomainStackProviders = Rule.define({
  name: 'alchemy-domain-stack-providers',
  meta: ruleMeta({
    type: 'problem',
    description:
      'Require the `alchemy.run.ts` Stack of an Alchemy Domain app to register the Domain providers next to the Cloudflare ones.',
    messages: {
      missing:
        'Register `DomainCloudflare.providers()` from `@alchemy.run/domain/Cloudflare` next to `Cloudflare.providers()`, as in `Layer.mergeAll(Cloudflare.providers(), DomainCloudflare.providers())`. Without them the deploy fails with no provider for `Cloudflare.Domain.Backfill`.',
    },
    url: 'https://alchemy.run/domain/cloudflare#deploy-it',
  }),
  *create() {
    const ctx = yield* RuleContext;

    if (!isStackFilename(Arr.lastNonEmpty(Str.split(ctx.filename, /[/\\]/u)))) {
      return {};
    }

    const file: DomainFile = { sourceCode: ctx.sourceCode, imports: yield* importBindings };

    return Visitor.on('CallExpression', (node) =>
      importedPath(node.callee, file).pipe(
        Opt.flatMap(namespaceMember('Alchemy')),
        Opt.filter((member) => member === 'Stack'),
        Opt.flatMap(() => argumentAt(node, 1)),
        Opt.map(unwrapExpression),
        Opt.filter((options): options is ESTree.ObjectExpression => options.type === 'ObjectExpression'),
        Opt.flatMap(objectProperty('providers')),
        Opt.filter(
          ({ value }) =>
            callsProviders(ctx.sourceCode, value, ['@alchemy.run/cloudflare']) &&
            !callsProviders(ctx.sourceCode, value, ['@alchemy.run/domain/Cloudflare']),
        ),
        Opt.match({
          onNone: () => Effect.void,
          onSome: (providers) => ctx.report(Diagnostic.fromId({ node: providers, messageId: 'missing' })),
        }),
      ),
    );
  },
});

import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { argumentAt, objectProperty, unwrapExpression } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { TestOrStoryFilename } from '../../schemas/names';
import { domainBlock, type DomainFile } from './internal/domain';

const isTestFile = Schema.is(TestOrStoryFilename);

/**
 * Whether the annotations argument may describe the block: a `description` key, or anything the rule cannot read, such
 * as a spread or a shared constant.
 *
 * @param annotations Third argument of the block call.
 */
function mayDescribe(annotations: ESTree.Expression): boolean {
  const node = unwrapExpression(annotations);

  return (
    node.type !== 'ObjectExpression' ||
    Opt.isSome(objectProperty(node, 'description')) ||
    Arr.some(node.properties, (property) => property.type === 'SpreadElement')
  );
}

export const alchemyDomainRequireDescription = Rule.define({
  name: 'alchemy-domain-require-description',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Require every Alchemy Domain declaration to carry a `{ description }` as its last argument.',
    messages: {
      missing:
        'Describe this {{block}} with `{ description }` as its last argument, written for whoever calls it. `toMcp` tools, `toCli` help and the `toHttpApi` OpenAPI document show it.',
    },
    url: 'https://alchemy.run/domain/annotations',
  }),
  *create() {
    const ctx = yield* RuleContext;

    if (isTestFile(Arr.lastNonEmpty(Str.split(ctx.filename, /[/\\]/u)))) {
      return {};
    }

    const file: DomainFile = { sourceCode: ctx.sourceCode, imports: yield* importBindings };

    return Visitor.on('CallExpression', (node) =>
      domainBlock(node, file).pipe(
        // `Domain.RequestContext<Self>()(key, schema)` takes no annotations.
        Opt.filter((block) => block !== 'RequestContext' && !Opt.exists(argumentAt(node, 2), mayDescribe)),
        Opt.match({
          onNone: () => Effect.void,
          onSome: (block) =>
            ctx.report(Diagnostic.fromId({ node: node.callee, messageId: 'missing', data: { block } })),
        }),
      ),
    );
  },
});

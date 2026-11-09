import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { argumentAt, objectProperty, unwrapExpression } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { domainBlock, type DomainFile } from './internal/domain';

/**
 * Whether a spread after `version` may override it.
 *
 * @param definition View definition.
 * @param version `version` property.
 */
function isOverridden(definition: ESTree.ObjectExpression, version: ESTree.ObjectProperty): boolean {
  return Arr.some(
    definition.properties.slice(definition.properties.indexOf(version) + 1),
    (property) => property.type === 'SpreadElement',
  );
}

export const alchemyDomainRequireViewVersion: CreateRule = Rule.define({
  name: 'alchemy-domain-require-view-version',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Require Alchemy Domain views to declare their version.',
    messages: {
      missing:
        'Declare `version` on this view (`version: 0` keeps the current default). Bump it whenever `evolve`, `emit`, `keyOf`, `state` or `from` changes, so the deploy rebuilds the view from its events.',
      overridden: 'Move `version` after the spread, so the spread cannot override the version this view declares.',
    },
    url: 'https://alchemy.run/domain/model#change-a-view-bump-its-version',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const file: DomainFile = { sourceCode: ctx.sourceCode, imports: yield* importBindings };

    function check(node: ESTree.CallExpression, definition: ESTree.ObjectExpression) {
      return Opt.match(objectProperty(definition, 'version'), {
        onNone: () => ctx.report(Diagnostic.fromId({ node: node.callee, messageId: 'missing' })),
        onSome: (version) =>
          isOverridden(definition, version)
            ? ctx.report(Diagnostic.fromId({ node: version, messageId: 'overridden' }))
            : Effect.void,
      });
    }

    return Visitor.on('CallExpression', (node) =>
      Opt.match(
        argumentAt(node, 1).pipe(
          Opt.map(unwrapExpression),
          Opt.filter((definition): definition is ESTree.ObjectExpression => definition.type === 'ObjectExpression'),
          Opt.filter(() => Opt.contains(domainBlock(node, file), 'View')),
        ),
        { onNone: () => Effect.void, onSome: (definition) => check(node, definition) },
      ),
    );
  },
});

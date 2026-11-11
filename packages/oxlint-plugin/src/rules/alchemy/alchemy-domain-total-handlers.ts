import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as R from 'effect/Record';
import type * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';

import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { domainSection, importedPath, isImportReference, type DomainFile } from './internal/domain';

const totalSections: Readonly<Record<string, ReadonlyArray<string>>> = {
  Aggregate: ['evolve', 'reply'],
  View: ['evolve'],
};

const isThrowingModule = Schema.is(Schema.Literals(['Option', 'Result']));

const isThrowingGetter = Schema.is(
  Schema.Literals(['getOrThrow', 'getOrThrowWith'] satisfies ReadonlyArray<keyof typeof Opt & keyof typeof Result>),
);

export const alchemyDomainTotalHandlers = Rule.define({
  name: 'alchemy-domain-total-handlers',
  meta: ruleMeta({
    type: 'problem',
    description:
      'Require Alchemy Domain evolve and reply handlers to be total, and decide handlers to reject instead of throwing.',
    messages: {
      partial:
        '`{{section}}` must be total and never fail: {{api}} throws when the state is not what it expects. Keep any state the event cannot follow, such as `s._tag === "Open" ? { ...s, ... } : s`.',
      reject:
        '`decide` never throws: {{api}} becomes a defect the caller cannot handle. Return a rejection the command lists in `rejects` instead, or `return yield* rejection` in an `Effect.fn`.',
    },
    url: 'https://alchemy.run/domain/aggregate',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const file: DomainFile = { sourceCode: ctx.sourceCode, imports: yield* importBindings };

    function report(node: ESTree.Node, api: string) {
      return Opt.match(domainSection(node, file), {
        onNone: () => Effect.void,
        onSome: ({ block, section }) => {
          if (block === 'Aggregate' && section === 'decide') {
            return ctx.report(Diagnostic.fromId({ node, messageId: 'reject', data: { api } }));
          }

          return Opt.exists(R.get(totalSections, block), Arr.contains(section))
            ? ctx.report(Diagnostic.fromId({ node, messageId: 'partial', data: { section, api } }))
            : Effect.void;
        },
      });
    }

    function checkGetter(node: ESTree.Node) {
      return importedPath(node, file).pipe(
        Opt.filter(
          (path) =>
            path.length === 2 &&
            Opt.exists(Arr.head(path), isThrowingModule) &&
            Opt.exists(Arr.get(path, 1), isThrowingGetter),
        ),
        Opt.match({ onNone: () => Effect.void, onSome: (path) => report(node, `\`${Arr.join(path, '.')}\``) }),
      );
    }

    return Visitor.merge(
      Visitor.on('ThrowStatement', (node) => report(node, '`throw`')),
      // References, not only calls, so point-free `pipe(s.running, Option.getOrThrow)` counts too.
      Visitor.on('MemberExpression', checkGetter),
      Visitor.on('Identifier', (node) => (isImportReference(node, ctx.sourceCode) ? checkGetter(node) : Effect.void)),
    );
  },
});

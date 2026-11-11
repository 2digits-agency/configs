import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

const isRemovedApi = Schema.is(Schema.Literals(['Secret', 'Variable']));

export const alchemyNoRemovedConfigApi = Rule.define({
  name: 'alchemy-no-removed-config-api',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow removed Alchemy Secret and Variable APIs.',
    messages: {
      removed:
        'Alchemy.{{api}} was removed. Use effect/Config (Config.redacted for secrets, Config.string for variables).',
    },
    url: 'https://alchemy.run/blog/2026-05-29-beta-45',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      imports.path(node.callee).pipe(
        Opt.filter((path) => Opt.contains(Arr.head(path), 'Alchemy')),
        Opt.flatMap((path) => Arr.get(path, 1)),
        Opt.filter(isRemovedApi),
        Opt.match({
          onNone: () => Effect.void,
          onSome: (api) => ctx.report(Diagnostic.fromId({ node: node.callee, messageId: 'removed', data: { api } })),
        }),
      ),
    );
  },
});

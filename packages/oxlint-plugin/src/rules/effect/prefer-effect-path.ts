import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

const NodePathSource = Schema.Literals(['node:path', 'path']);

const isNodePathSource = Schema.is(NodePathSource);

export const preferEffectPath: CreateRule = Rule.define({
  name: 'prefer-effect-path',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer the Effect Path service over direct Node.js path imports in Effect projects.',
    messages: { effectPath: 'Use the Path service from effect/Path instead of {{source}}.' },
    url: 'https://www.effect.website/docs/v4/api/effect/Path',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    return Visitor.on('ImportDeclaration', ({ source }) =>
      isNodePathSource(source.value)
        ? ctx.report(Diagnostic.fromId({ node: source, messageId: 'effectPath', data: { source: source.value } }))
        : Effect.void,
    );
  },
});

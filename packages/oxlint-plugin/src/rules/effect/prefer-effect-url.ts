import { Diagnostic, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import { staticPath } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';
import { isGlobalIdentifier } from '../../internal/scope';

const UrlParseMethod = Schema.Literals(['canParse', 'parse']);

const isUrlParseMethod = Schema.is(UrlParseMethod);

function isUrlParseCall(node: ESTree.CallExpression): boolean {
  return Opt.exists(
    staticPath(node.callee),
    (path) => path.length === 2 && path[0] === 'URL' && isUrlParseMethod(path[1]),
  );
}

export const preferEffectUrl: CreateRule = defineRule({
  name: 'prefer-effect-url',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Effect Url helpers for safe URL parsing in Effect projects.',
    messages: {
      effectUrl: 'Use Url.fromString or Url.make so invalid URLs are represented as Result failures.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/unstable/http/Url',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    function reportWhenGlobal(node: ESTree.Node, reference: ESTree.Node) {
      return Effect.when(
        ctx.report(Diagnostic.fromId({ node, messageId: 'effectUrl' })),
        isGlobalIdentifier(reference, 'URL'),
      );
    }

    if (!imports.hasEffectImport) {
      return {};
    }

    return Visitor.merge(
      Visitor.on('NewExpression', (node) => reportWhenGlobal(node, node.callee)),
      Visitor.on('CallExpression', (node) =>
        isUrlParseCall(node) && node.callee.type === 'MemberExpression'
          ? reportWhenGlobal(node, node.callee.object)
          : Effect.void,
      ),
    );
  },
});

import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as HttpMethod from 'effect/http/HttpMethod';

import { isStringLiteral } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

/**
 * Lists with fewer methods are usually deliberate subsets, such as `['GET', 'HEAD']` for safe methods or the methods
 * one route accepts.
 */
const minimumMethods = 6;

/**
 * Whether every item is a string literal HTTP method and the list names at least `minimumMethods` different ones.
 *
 * @param values Literal values, none when an item is not a string literal.
 */
function isMethodList(values: ReadonlyArray<Opt.Option<string>>): boolean {
  return Opt.exists(
    Opt.all(values),
    (methods) => Arr.every(methods, HttpMethod.isHttpMethod) && new Set(methods).size >= minimumMethods,
  );
}

function unionMemberValue(member: ESTree.TSType): Opt.Option<string> {
  return member.type === 'TSLiteralType' && isStringLiteral(member.literal)
    ? Opt.some(member.literal.value)
    : Opt.none();
}

export const preferEffectHttpMethod: CreateRule = Rule.define({
  name: 'prefer-effect-http-method',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer the Effect HttpMethod type and guards over hand-written lists of HTTP methods.',
    messages: {
      methodList:
        'Use HttpMethod.HttpMethod, HttpMethod.all or HttpMethod.isHttpMethod instead of listing HTTP methods by hand. HttpMethod also includes TRACE and QUERY.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/http/HttpMethod',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    return Visitor.merge(
      Visitor.on('ArrayExpression', (node) =>
        isMethodList(
          Arr.map(node.elements, (element) =>
            P.isNotNull(element) && isStringLiteral(element) ? Opt.some(element.value) : Opt.none(),
          ),
        )
          ? ctx.report(Diagnostic.fromId({ node, messageId: 'methodList' }))
          : Effect.void,
      ),
      Visitor.on('TSUnionType', (node) =>
        isMethodList(Arr.map(node.types, unionMemberValue))
          ? ctx.report(Diagnostic.fromId({ node, messageId: 'methodList' }))
          : Effect.void,
      ),
    );
  },
});

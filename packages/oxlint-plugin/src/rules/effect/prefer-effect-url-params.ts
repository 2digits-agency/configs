import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { isStringLiteral } from '../../internal/ast';
import { isTestFilename } from '../../internal/files';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isGlobalIdentifier } from '../../internal/scope';

/**
 * Text that ends in a query key waiting for its value: `?page=`, `&sort=` or `?filters%5Bemail%5D=`.
 */
const queryKeyPattern = /[?&][\w.%[\]-]+=$/u;

function endsInQueryKey(text: string): boolean {
  return queryKeyPattern.test(text);
}

/**
 * Whether a template literal interpolates a value right after a query key, as in `` `/users?page=${page}` ``.
 *
 * @param node Template literal.
 */
function isManualQueryTemplate(node: ESTree.TemplateLiteral): boolean {
  return Arr.some(Arr.take(node.quasis, node.expressions.length), (quasi) =>
    endsInQueryKey(quasi.value.cooked ?? quasi.value.raw),
  );
}

/**
 * Whether a concatenation appends a value right after a query key, as in `'/users?page=' + page` or `base + '?page=' +
 * page`.
 *
 * @param node Binary expression.
 */
function isManualQueryConcat(node: ESTree.BinaryExpression): boolean {
  // `base + '?page=' + page` parses as `(base + '?page=') + page`.
  const prefix = node.left.type === 'BinaryExpression' && node.left.operator === '+' ? node.left.right : node.left;

  return node.operator === '+' && isStringLiteral(prefix) && endsInQueryKey(prefix.value);
}

/**
 * Whether `new URLSearchParams(…)` builds parameters, from nothing or from an object or array literal. Parsing a query
 * or form body string has no `UrlParams` counterpart, so other arguments are allowed.
 *
 * @param node Construction.
 */
function buildsParams(node: ESTree.NewExpression): boolean {
  return Opt.match(Arr.head(node.arguments), {
    onNone: () => true,
    onSome: (argument) => argument.type === 'ObjectExpression' || argument.type === 'ArrayExpression',
  });
}

export const preferEffectUrlParams = Rule.define({
  name: 'prefer-effect-url-params',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Effect UrlParams over URLSearchParams and hand-built query strings in Effect projects.',
    messages: {
      urlSearchParams:
        'Use UrlParams.fromInput for immutable query parameters, and HttpClientRequest.setUrlParams or UrlParams.toString to apply them.',
      manualQuery:
        'Build query strings with UrlParams.fromInput and UrlParams.toString, or HttpClientRequest.setUrlParams, which encode every value.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/http/UrlParams',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    // Tests build raw request URLs and form bodies on purpose, to pin down what goes over the wire.
    if (!imports.hasEffectImport || isTestFilename(ctx.filename)) {
      return {};
    }

    return Visitor.merge(
      Visitor.on('NewExpression', (node) =>
        Effect.when(
          ctx.report(Diagnostic.fromId({ node, messageId: 'urlSearchParams' })),
          Effect.map(isGlobalIdentifier(node.callee, 'URLSearchParams'), (global) => global && buildsParams(node)),
        ),
      ),
      Visitor.on('TemplateLiteral', (node) =>
        // Tagged templates such as sql`…` define their own escaping.
        isManualQueryTemplate(node) && node.parent.type !== 'TaggedTemplateExpression'
          ? ctx.report(Diagnostic.fromId({ node, messageId: 'manualQuery' }))
          : Effect.void,
      ),
      Visitor.on('BinaryExpression', (node) =>
        isManualQueryConcat(node) ? ctx.report(Diagnostic.fromId({ node, messageId: 'manualQuery' })) : Effect.void,
      ),
    );
  },
});

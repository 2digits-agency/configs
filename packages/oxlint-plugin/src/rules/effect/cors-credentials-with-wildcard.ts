import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import type * as HttpMiddleware from 'effect/http/HttpMiddleware';
import type * as HttpRouter from 'effect/http/HttpRouter';

import { isLiteral, objectArgument, objectProperty, unwrapExpression } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

function wildcardOrigins(node: ESTree.Expression): boolean {
  const origins = unwrapExpression(node);

  return (
    isLiteral(origins, '*') ||
    (origins.type === 'ArrayExpression' &&
      (Arr.isReadonlyArrayEmpty(origins.elements) ||
        Arr.some(origins.elements, (element) => P.isNotNull(element) && isLiteral(element, '*'))))
  );
}

function isCorsApi(node: ESTree.Node, imports: ImportBindings): boolean {
  return (
    imports.isApi(node, 'HttpMiddleware', 'cors' satisfies keyof typeof HttpMiddleware) ||
    imports.isApi(node, 'HttpRouter', 'cors' satisfies keyof typeof HttpRouter) ||
    // Effect v3 name, which the current Effect types no longer export.
    imports.isApi(node, 'HttpApiBuilder', 'middlewareCors')
  );
}

/**
 * Credentialed CORS options whose `allowedOrigins` is missing, `'*'`, empty or contains `'*'`.
 *
 * @param options CORS options.
 */
function credentialedWildcard(options: ESTree.ObjectExpression): boolean {
  const credentials = Opt.getOrElse(
    Opt.map(objectProperty(options, 'credentials'), ({ value }): ESTree.Node => value),
    (): ESTree.Node => options,
  );

  return (
    isLiteral(credentials, true) &&
    Opt.match(objectProperty(options, 'allowedOrigins'), {
      onNone: () => true,
      onSome: ({ value }) => wildcardOrigins(value),
    })
  );
}

export const corsCredentialsWithWildcard: CreateRule = Rule.define({
  name: 'cors-credentials-with-wildcard',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow credentialed CORS with wildcard origins because browsers reject that combination.',
    messages: {
      wildcard:
        'Credentialed CORS cannot use a wildcard origin. Set allowedOrigins to explicit trusted origins or disable credentials.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/400',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      isCorsApi(node.callee, imports) && Opt.exists(objectArgument(node), credentialedWildcard)
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'wildcard' }))
        : Effect.void,
    );
  },
});

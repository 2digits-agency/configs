import { Diagnostic, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import { argumentAt, isLiteral, parentOfType, staticPath, staticPropertyName } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';

const JwtLibrary = Schema.Literals([
  '@tsndr/cloudflare-worker-jwt',
  'fast-jwt',
  'hono/jwt',
  'jose',
  'jsonwebtoken',
  'jwt-decode',
  'jwt-simple',
]);

const isJwtLibrary = Schema.is(JwtLibrary);

const JwtSegmentName = Schema.Literals(['header', 'payload', 'signature']);

const isJwtSegmentName = Schema.is(JwtSegmentName);

function isDot(node: ESTree.Node): boolean {
  return isLiteral(node, '.');
}

/**
 * Whether a split result is destructured into JWT segments, as in `const [header, payload, signature] = ...`.
 *
 * @param node Split call.
 */
function isDestructuredIntoSegments(node: ESTree.CallExpression): boolean {
  return Opt.exists(
    parentOfType(node, 'VariableDeclarator'),
    ({ id }) =>
      id.type === 'ArrayPattern' &&
      Arr.some(id.elements, (element) => element?.type === 'Identifier' && isJwtSegmentName(element.name)),
  );
}

export const preferEffectJwt: CreateRule = defineRule({
  name: 'prefer-effect-jwt',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Effect Jwt over JWT libraries and tokens split and decoded by hand in Effect projects.',
    messages: {
      jwtLibrary:
        'Use Jwt from effect/jose instead of {{source}}: it decodes the claims with a Schema and fails with a typed JwtError.',
      manualJwt:
        "Do not split a JWT on '.' by hand. Use Jwt.verify or Jwt.verifyWithKeySet from effect/jose, which check the signature, exp and nbf before decoding the claims with a Schema, and Jwt.decodeUnverified only to choose a key.",
    },
    url: 'https://effect.website/docs/v4/api/effect/jose/Jwt',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    /**
     * The string a call splits on `'.'`: `subject.split('.')` or `Str.split(subject, '.')`.
     *
     * @param node Call.
     */
    function dotSplitSubject(node: ESTree.CallExpression): Opt.Option<ESTree.Node> {
      if (imports.isApi(node.callee, 'String', 'split')) {
        return Opt.exists(argumentAt(node, 1), isDot) ? argumentAt(node, 0) : Opt.none();
      }

      return node.callee.type === 'MemberExpression' &&
        Opt.contains(staticPropertyName(node.callee), 'split') &&
        Opt.exists(argumentAt(node, 0), isDot)
        ? Opt.some(node.callee.object)
        : Opt.none();
    }

    return Visitor.merge(
      Visitor.on('ImportDeclaration', ({ source }) =>
        isJwtLibrary(source.value)
          ? ctx.report(Diagnostic.fromId({ node: source, messageId: 'jwtLibrary', data: { source: source.value } }))
          : Effect.void,
      ),
      // A token is a string whose name says so, such as `token`, `idToken` or `request.jwt`.
      Visitor.on('CallExpression', (node) =>
        Opt.exists(
          dotSplitSubject(node),
          (subject) =>
            Opt.exists(staticPath(subject), (path) => /jwt|token/iu.test(Arr.lastNonEmpty(path))) ||
            isDestructuredIntoSegments(node),
        )
          ? ctx.report(Diagnostic.fromId({ node, messageId: 'manualJwt' }))
          : Effect.void,
      ),
    );
  },
});

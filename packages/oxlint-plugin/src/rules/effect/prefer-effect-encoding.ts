import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import { argumentAt, isStringLiteral, staticPath } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isGlobalIdentifier } from '../../internal/scope';

const Encoding = Schema.Literals(['base64', 'base64url', 'hex']);

const isEncoding = Schema.is(Encoding);

function isEncodingArgument(node: Opt.Option<ESTree.Expression>): boolean {
  return Opt.exists(node, (argument) => isStringLiteral(argument) && isEncoding(argument.value));
}

function isBufferEncoding(node: ESTree.CallExpression): boolean {
  return Opt.exists(
    staticPath(node.callee),
    (path) =>
      (Arr.join(path, '.') === 'Buffer.from' && isEncodingArgument(argumentAt(node, 1))) ||
      (Arr.lastNonEmpty(path) === 'toString' && isEncodingArgument(argumentAt(node, 0))),
  );
}

export const preferEffectEncoding: CreateRule = Rule.define({
  name: 'prefer-effect-encoding',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Effect Encoding for portable Base64, Base64Url, and hexadecimal encoding.',
    messages: { effectEncoding: 'Use Encoding encode/decode helpers; decoders return Result instead of throwing.' },
    url: 'https://www.effect.website/docs/v4/api/effect/Encoding',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    function isGlobalBase64Call(node: ESTree.CallExpression) {
      return Arr.isReadonlyArrayNonEmpty(node.arguments)
        ? Effect.map(
            Effect.all([isGlobalIdentifier(node.callee, 'atob'), isGlobalIdentifier(node.callee, 'btoa')]),
            Arr.some(Boolean),
          )
        : Effect.succeed(false);
    }

    return Visitor.on('CallExpression', (node) =>
      Effect.when(
        ctx.report(Diagnostic.fromId({ node, messageId: 'effectEncoding' })),
        Effect.map(isGlobalBase64Call(node), (base64) => base64 || isBufferEncoding(node)),
      ),
    );
  },
});

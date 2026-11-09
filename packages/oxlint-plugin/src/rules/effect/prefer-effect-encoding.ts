import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import {
  argumentAt,
  isLiteral,
  isStringLiteral,
  objectProperty,
  staticPath,
  staticPropertyName,
} from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isGlobalIdentifier } from '../../internal/scope';

const Encoding = Schema.Literals(['base64', 'base64url', 'hex']);

type Encoding = typeof Encoding.Type;

const isEncoding = Schema.is(Encoding);

/**
 * The `effect/encoding` module for a Node.js `BufferEncoding`.
 */
const moduleName: Record<Encoding, string> = { base64: 'Base64', base64url: 'Base64Url', hex: 'Hex' };

interface NativeEncoding {
  readonly messageId: 'atob' | 'btoa' | 'decode' | 'encode';
  readonly native: string;
  readonly replacement: string;
}

function encodingArgument(node: ESTree.CallExpression, index: number): Opt.Option<Encoding> {
  return Opt.flatMap(argumentAt(node, index), (argument) =>
    isStringLiteral(argument) && isEncoding(argument.value) ? Opt.some(argument.value) : Opt.none(),
  );
}

/**
 * Whether `Uint8Array.fromBase64(x, { alphabet: 'base64url' })` decodes the URL-safe alphabet.
 *
 * @param node `Uint8Array.fromBase64` call.
 */
function isBase64UrlAlphabet(node: ESTree.CallExpression): boolean {
  return Opt.exists(
    Opt.flatMap(
      Opt.filter(argumentAt(node, 1), (options) => options.type === 'ObjectExpression'),
      (options) => objectProperty(options, 'alphabet'),
    ),
    ({ value }) => isLiteral(value, 'base64url'),
  );
}

/**
 * `Buffer.from(x, 'base64')`, `x.toString('hex')`, `Uint8Array.fromBase64(x)` or `Uint8Array.fromHex(x)`.
 *
 * @param node Call.
 */
function bufferEncoding(node: ESTree.CallExpression): Opt.Option<NativeEncoding> {
  if (node.callee.type === 'MemberExpression' && Opt.contains(staticPropertyName(node.callee), 'toString')) {
    return Opt.map(encodingArgument(node, 0), (encoding) => ({
      messageId: 'encode' as const,
      native: `toString('${encoding}')`,
      replacement: `${moduleName[encoding]}.encode`,
    }));
  }

  return Opt.flatMap(staticPath(node.callee), (path) => {
    const callee = Arr.join(path, '.');

    if (callee === 'Buffer.from') {
      return Opt.map(encodingArgument(node, 1), (encoding) => ({
        messageId: 'decode' as const,
        native: `Buffer.from(…, '${encoding}')`,
        replacement: `${moduleName[encoding]}.decode`,
      }));
    }

    if (callee === 'Uint8Array.fromHex') {
      return Opt.some({ messageId: 'decode' as const, native: callee, replacement: 'Hex.decode' });
    }

    if (callee === 'Uint8Array.fromBase64') {
      return Opt.some({
        messageId: 'decode' as const,
        native: callee,
        replacement: isBase64UrlAlphabet(node) ? 'Base64Url.decode' : 'Base64.decode',
      });
    }

    return Opt.none();
  });
}

const globalBase64 = {
  atob: { messageId: 'atob', native: 'atob', replacement: 'Base64.decode' },
  btoa: { messageId: 'btoa', native: 'btoa', replacement: 'Base64.encode' },
} as const satisfies Record<string, NativeEncoding>;

const GlobalBase64Name = Schema.Literals(['atob', 'btoa']);

const isGlobalBase64Name = Schema.is(GlobalBase64Name);

export const preferEffectEncoding: CreateRule = Rule.define({
  name: 'prefer-effect-encoding',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer the Effect v4 Base64, Base64Url, and Hex modules over native binary encoding APIs.',
    messages: {
      atob: 'Use Base64.decode from effect/encoding instead of atob: it returns the bytes as a Uint8Array in a Result with an EncodingError, where atob returns a binary string and throws on invalid input. Use Base64.decodeString only for UTF-8 text.',
      btoa: 'Use Base64.encode from effect/encoding instead of btoa, and pass it the bytes rather than a binary string: btoa throws on characters above U+00FF, and Base64.encode encodes strings as UTF-8.',
      decode:
        'Use {{replacement}} from effect/encoding instead of {{native}}: it returns a Result with an EncodingError instead of throwing on invalid input.',
      encode:
        'Use {{replacement}} from effect/encoding instead of {{native}}: it accepts bytes or UTF-8 text and runs the same in Node.js, browsers, and Workers.',
    },
    url: 'https://effect.website/docs/v4/api/effect/encoding/Base64',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    /**
     * `atob(x)`, `btoa(x)`, `globalThis.atob(x)` or `globalThis.btoa(x)`, when `atob` and `btoa` are the globals.
     *
     * @param node Call.
     */
    function globalBase64Call(
      node: ESTree.CallExpression,
    ): Effect.Effect<Opt.Option<NativeEncoding>, never, RuleContext> {
      const callee =
        node.callee.type === 'MemberExpression' &&
        Opt.exists(staticPath(node.callee), (path) => path.length === 2 && Opt.contains(Arr.head(path), 'globalThis'))
          ? node.callee.object
          : node.callee;

      const name = Opt.flatMap(staticPath(node.callee), (path) =>
        Opt.liftPredicate(Arr.lastNonEmpty(path), isGlobalBase64Name),
      );

      return Opt.match(name, {
        onNone: () => Effect.succeedNone,
        onSome: (base64) =>
          Effect.map(isGlobalIdentifier(callee, callee === node.callee ? base64 : 'globalThis'), (global) =>
            global && Arr.isReadonlyArrayNonEmpty(node.arguments) ? Opt.some(globalBase64[base64]) : Opt.none(),
          ),
      });
    }

    return Visitor.on('CallExpression', (node) =>
      Effect.flatMap(globalBase64Call(node), (base64) =>
        Opt.match(
          Opt.orElse(base64, () => bufferEncoding(node)),
          {
            onNone: () => Effect.void,
            onSome: ({ messageId, native, replacement }) =>
              ctx.report(Diagnostic.fromId({ node, messageId, data: { native, replacement } })),
          },
        ),
      ),
    );
  },
});

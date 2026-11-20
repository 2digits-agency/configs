import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import {
  argumentAt,
  isLiteral,
  isSomeSame,
  isStringLiteral,
  staticPath,
  staticPropertyName,
  unwrapExpression,
  walkNodes,
} from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import type { ImportBindings } from '../../schemas/imports';
import { ReplaceMethod } from '../../schemas/platform';

const isReplaceMethod = Schema.is(ReplaceMethod);

function memberCall(
  node: ESTree.Node,
  isMethod: (name: string) => boolean,
): node is ESTree.CallExpression & {
  readonly callee: ESTree.MemberExpression;
} {
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    Opt.exists(staticPropertyName(node.callee), isMethod)
  );
}

function isReplaceCall(node: ESTree.Node) {
  return memberCall(node, isReplaceMethod);
}

/**
 * The single character a `replace` pattern matches: `'+'`, `/\+/g`, `/[+]/g` or `/-/g`.
 *
 * @param node Pattern argument.
 */
function patternCharacter(node: ESTree.Expression): Opt.Option<string> {
  if (isStringLiteral(node)) {
    return Opt.some(node.value);
  }

  if (node.type !== 'Literal' || !('regex' in node)) {
    return Opt.none();
  }

  const { pattern } = node.regex;

  const bracketed = /^\[(\\?.)\]$/u.exec(pattern)?.[1] ?? pattern;

  return Opt.some(bracketed.length === 2 && Str.startsWith('\\')(bracketed) ? Str.slice(1)(bracketed) : bracketed);
}

/**
 * The character swap of one `replace` call, such as `+-` for `.replace(/\+/g, '-')`.
 *
 * @param node Replace call.
 */
function characterSwap(node: ESTree.CallExpression): Opt.Option<string> {
  return Opt.all([Opt.flatMap(argumentAt(node, 0), patternCharacter), argumentAt(node, 1)]).pipe(
    Opt.flatMap(([from, replacement]) =>
      isStringLiteral(replacement) && from.length === 1 && replacement.value.length === 1
        ? Opt.some(`${from}${replacement.value}`)
        : Opt.none(),
    ),
  );
}

/**
 * The character swaps of a `replace` chain, from the outermost call inwards.
 *
 * @param node Outermost replace call.
 */
function chainSwaps(node: ESTree.Node): ReadonlyArray<string> {
  if (!isReplaceCall(node)) {
    return [];
  }

  return [...Opt.toArray(characterSwap(node)), ...chainSwaps(unwrapExpression(node.callee.object))];
}

/**
 * Whether a call is the last `replace` of its chain, so a chain is reported once.
 *
 * @param node Replace call.
 */
function isOutermostReplace(node: ESTree.CallExpression): boolean {
  const { parent } = node;

  return (
    parent.type !== 'MemberExpression' ||
    parent.object !== node ||
    !isReplaceCall(parent.parent) ||
    parent.parent.callee !== parent
  );
}

/**
 * A `replace` chain or a `pipe` of `Str.replace` steps that converts between the Base64 and Base64Url alphabets: it
 * swaps `+` with `-` and `/` with `_`.
 *
 * @param node Call.
 * @param imports Import bindings of the file.
 */
function isBase64UrlConversion(node: ESTree.CallExpression, imports: ImportBindings): boolean {
  const swaps = isReplaceCall(node) ? (isOutermostReplace(node) ? chainSwaps(node) : []) : pipeSwaps(node, imports);

  return (
    (Arr.contains(swaps, '+-') || Arr.contains(swaps, '-+')) && (Arr.contains(swaps, '/_') || Arr.contains(swaps, '_/'))
  );
}

/**
 * The character swaps of `Str.replace`/`Str.replaceAll` steps in `pipe(x, …)` or `x.pipe(…)`.
 *
 * @param node Call.
 * @param imports Import bindings of the file.
 */
function pipeSwaps(node: ESTree.CallExpression, imports: ImportBindings): ReadonlyArray<string> {
  const isMethodPipe = node.callee.type === 'MemberExpression' && Opt.contains(staticPropertyName(node.callee), 'pipe');

  if (!isMethodPipe && !isPipe(node.callee, imports)) {
    return [];
  }

  return Arr.flatMap(node.arguments, (step) =>
    step.type === 'CallExpression' && imports.isApi(step.callee, 'String', ['replace', 'replaceAll'])
      ? Opt.toArray(characterSwap(step))
      : [],
  );
}

const paddingPatterns: ReadonlyArray<string> = ['=', '=+', '=+$', '=*$', '={1,2}$', '={0,2}$'];

function isPaddingPattern(node: ESTree.Expression): boolean {
  if (isStringLiteral(node)) {
    return node.value === '=';
  }

  return node.type === 'Literal' && 'regex' in node && Arr.contains(paddingPatterns, node.regex.pattern);
}

/**
 * Whether a `replace`/`replaceAll` call or `Str.replace`/`Str.replaceAll` step deletes `=` padding, as in
 * `.replace(/=+$/, '')`.
 *
 * @param node Replace call.
 */
function stripsPadding(node: ESTree.CallExpression): boolean {
  return Opt.exists(argumentAt(node, 0), isPaddingPattern) && Opt.exists(argumentAt(node, 1), isLiteral(''));
}

function isBase64Encode(node: ESTree.Node, imports: ImportBindings): boolean {
  return node.type === 'CallExpression' && imports.isApi(node.callee, 'Base64', 'encode');
}

/**
 * Whether a call strips the padding from `Base64.encode` output: `Base64.encode(x).replace(/=+$/, '')`,
 * `pipe(Base64.encode(x), Str.replace(/=+$/, ''))` or `Base64.encode(x).pipe(Str.replaceAll('=', ''))`.
 *
 * @param node Call.
 * @param imports Import bindings of the file.
 */
function isUnpaddedBase64(node: ESTree.CallExpression, imports: ImportBindings): boolean {
  if (isReplaceCall(node)) {
    return stripsPadding(node) && isBase64Encode(unwrapExpression(node.callee.object), imports);
  }

  const head =
    node.callee.type === 'MemberExpression' && Opt.contains(staticPropertyName(node.callee), 'pipe')
      ? Opt.some(node.callee.object)
      : isPipe(node.callee, imports)
        ? argumentAt(node, 0)
        : Opt.none();

  return (
    Opt.exists(head, (expression) => isBase64Encode(unwrapExpression(expression), imports)) &&
    Arr.some(
      node.arguments,
      (step) =>
        step.type === 'CallExpression' &&
        imports.isApi(step.callee, 'String', ['replace', 'replaceAll']) &&
        stripsPadding(step),
    )
  );
}

function readsLength(node: ESTree.Node): boolean {
  return walkNodes(
    node,
    (child) => child.type === 'MemberExpression' && Opt.contains(staticPropertyName(child), 'length'),
  );
}

/**
 * Whether an expression is `Math.ceil(s.length / 4)`.
 *
 * @param node Expression.
 */
function isLengthInBlocks(node: ESTree.Node): boolean {
  if (
    node.type !== 'CallExpression' ||
    !Opt.exists(staticPath(node.callee), (path) => Arr.join(path, '.') === 'Math.ceil')
  ) {
    return false;
  }

  return Opt.exists(argumentAt(node, 0), (argument) => {
    const quotient = unwrapExpression(argument);

    return (
      quotient.type === 'BinaryExpression' &&
      quotient.operator === '/' &&
      isLiteral(quotient.right, 4) &&
      readsLength(quotient.left)
    );
  });
}

/**
 * Whether an expression rounds a string's length to the Base64 block size of four: `s.length % 4` or `s.length & 3` for
 * the missing padding, or `Math.ceil(s.length / 4) * 4` for the padded length. A width that is not a `.length`, as in
 * `'='.repeat(width / 4)`, is a separator.
 *
 * @param node Length expression.
 */
function isBase64BlockArithmetic(node: ESTree.Node): boolean {
  return walkNodes(node, (child) => {
    if (child.type !== 'BinaryExpression') {
      return false;
    }

    if (
      (child.operator === '%' && isLiteral(child.right, 4)) ||
      (child.operator === '&' && isLiteral(child.right, 3))
    ) {
      return readsLength(child.left);
    }

    return child.operator === '*' && isLiteral(child.right, 4) && isLengthInBlocks(unwrapExpression(child.left));
  });
}

/**
 * Whether a call adds `=` padding up to a multiple of four: `'='.repeat((4 - s.length % 4) % 4)`,
 * `s.padEnd(Math.ceil(s.length / 4) * 4, '=')` or the same with `Str.padEnd`.
 *
 * @param node Call.
 * @param imports Import bindings of the file.
 */
function isBase64Padding(node: ESTree.CallExpression, imports: ImportBindings): boolean {
  if (memberCall(node, (name) => name === 'repeat')) {
    return isLiteral(node.callee.object, '=') && Opt.exists(argumentAt(node, 0), isBase64BlockArithmetic);
  }

  const isPadEnd =
    memberCall(node, (name) => name === 'padEnd') ||
    imports.isApi(node.callee, 'String', 'padEnd' satisfies keyof typeof Str);

  return (
    isPadEnd &&
    Opt.exists(argumentAt(node, 1), isLiteral('=')) &&
    Opt.exists(argumentAt(node, 0), isBase64BlockArithmetic)
  );
}

function isTwoDigitZeroPadding(node: ESTree.CallExpression): boolean {
  return Opt.exists(argumentAt(node, 0), isLiteral(2)) && Opt.exists(argumentAt(node, 1), isLiteral('0'));
}

function isStringPadStart(node: ESTree.Node, imports: ImportBindings): boolean {
  return (
    node.type === 'CallExpression' &&
    imports.isApi(node.callee, 'String', 'padStart' satisfies keyof typeof Str) &&
    isTwoDigitZeroPadding(node)
  );
}

function isPipe(node: ESTree.Node, imports: ImportBindings): boolean {
  return imports.isApi(node, 'Function', 'pipe') || (node.type === 'Identifier' && node.name === 'pipe');
}

/**
 * Whether `x.toString(16)` is padded to two digits with `'0'`, the hand-written way to hex-encode a byte:
 * `x.toString(16).padStart(2, '0')`, `Str.padStart(2, '0')(x.toString(16))` or `pipe(x.toString(16), Str.padStart(2,
 * '0'))`.
 *
 * @param node `toString(16)` call.
 * @param imports Import bindings of the file.
 */
function isPaddedByteHex(node: ESTree.CallExpression, imports: ImportBindings): boolean {
  const { parent } = node;

  if (parent.type === 'MemberExpression') {
    return (
      parent.object === node &&
      Opt.contains(staticPropertyName(parent), 'padStart') &&
      parent.parent.type === 'CallExpression' &&
      parent.parent.callee === parent &&
      isTwoDigitZeroPadding(parent.parent)
    );
  }

  if (parent.type !== 'CallExpression' || !isSomeSame<ESTree.Node>(argumentAt(parent, 0), node)) {
    return false;
  }

  return (
    isStringPadStart(parent.callee, imports) ||
    (isPipe(parent.callee, imports) && Opt.exists(argumentAt(parent, 1), (step) => isStringPadStart(step, imports)))
  );
}

function isHexToString(node: ESTree.CallExpression): boolean {
  return (
    memberCall(node, (name) => name === 'toString') &&
    node.arguments.length === 1 &&
    Opt.exists(argumentAt(node, 0), isLiteral(16))
  );
}

export const noManualEncoding = Rule.define({
  name: 'no-manual-encoding',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Disallow hand-written Base64 padding, Base64Url and hexadecimal conversions in Effect projects.',
    messages: {
      base64Url:
        "Swapping '+'/'-' and '/'/'_' by hand converts between Base64 and Base64Url. Use Base64Url.encode or Base64Url.decode from effect/encoding.",
      base64Padding:
        "Padding Base64 text with '=' to a multiple of four by hand. Use Base64.decodeLenient from effect/encoding, which decodes unpadded Base64 and Base64Url.",
      base64Unpadded:
        "Stripping '=' from Base64.encode output writes unpadded Base64 by hand. Use Base64.encodeUnpadded from effect/encoding.",
      hex: "Padding each byte's toString(16) to two digits hand-writes hexadecimal encoding. Use Hex.encode from effect/encoding.",
    },
    url: 'https://effect.website/docs/v4/api/effect/encoding/Base64Url',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    return Visitor.on('CallExpression', (node) => {
      if (isBase64UrlConversion(node, imports)) {
        return ctx.report(Diagnostic.fromId({ node, messageId: 'base64Url' }));
      }

      if (isUnpaddedBase64(node, imports)) {
        return ctx.report(Diagnostic.fromId({ node, messageId: 'base64Unpadded' }));
      }

      if (isBase64Padding(node, imports)) {
        return ctx.report(Diagnostic.fromId({ node, messageId: 'base64Padding' }));
      }

      return isHexToString(node) && isPaddedByteHex(node, imports)
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'hex' }))
        : Effect.void;
    });
  },
});

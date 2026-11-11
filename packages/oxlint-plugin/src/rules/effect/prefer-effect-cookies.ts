import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import {
  argumentAt,
  containsSame,
  isStringLiteral,
  parentOfType,
  staticPropertyName,
  unwrapExpression,
} from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isGlobalIdentifier } from '../../internal/scope';

const CookieHeader = Schema.Literals(['cookie', 'set-cookie']);

const isCookieHeader = Schema.is(CookieHeader);

const ParseMethod = Schema.Literals(['split', 'match', 'matchAll']);

const isParseMethod = Schema.is(ParseMethod);

const InspectMethod = Schema.Literals(['includes', 'startsWith', 'endsWith']);

const isInspectMethod = Schema.is(InspectMethod);

/**
 * A `; Name` or `; Name=` cookie attribute, as in `; Path=/` or `; HttpOnly`.
 */
const attributePattern = /;\s*(?:HttpOnly|Secure|Partitioned|(?:Path|Domain|Max-Age|Expires|SameSite)=)/iu;

/**
 * A substring that only a Set-Cookie value has: an attribute after `;`, or `HttpOnly`, `Max-Age=` or `SameSite=` on
 * their own. A bare `Secure` is too common a word to count.
 */
const attributeProbePattern =
  /^(?:;\s*(?:HttpOnly|Secure|Partitioned|Path|Domain|Max-Age|Expires|SameSite)\b|HttpOnly$|Max-Age=|SameSite=)/iu;

function isCookieName(name: string): boolean {
  return Str.includes('cookie')(Str.toLowerCase(name));
}

/**
 * The expression raw cookie text comes from, through `?.`, `??`, `||`, type assertions and `String(…)`.
 *
 * @param node Expression.
 */
function cookieTextSource(node: ESTree.Expression): ESTree.Expression {
  const target = unwrapExpression(node);

  const inner: Opt.Option<ESTree.Expression> =
    target.type === 'ChainExpression'
      ? Opt.some(target.expression)
      : target.type === 'LogicalExpression'
        ? Opt.some(target.left)
        : target.type === 'CallExpression' && target.callee.type === 'Identifier' && target.callee.name === 'String'
          ? argumentAt(target, 0)
          : Opt.none();

  return Opt.match(inner, { onNone: () => target, onSome: cookieTextSource });
}

/**
 * Whether an expression holds raw cookie text: a binding or member named after cookies (`cookieHeader`,
 * `request.headers.cookie`, `document.cookie`) or a `get('cookie')` or `get('set-cookie')` header read.
 */
const isCookieSource = Match.type<ESTree.Expression>().pipe(
  Match.discriminators('type')({
    Identifier: ({ name }) => isCookieName(name),
    MemberExpression: (member) => Opt.exists(staticPropertyName(member), isCookieName),
    CallExpression: (call) =>
      Opt.contains(calledMethod(call), 'get') &&
      Arr.some(
        call.arguments,
        (argument) => isStringLiteral(argument) && isCookieHeader(Str.toLowerCase(argument.value)),
      ),
  }),
  Match.orElse(Fn.constFalse),
);

function isCookieText(node: ESTree.Expression): boolean {
  return isCookieSource(cookieTextSource(node));
}

/**
 * The method a call invokes on a receiver, such as `split` for `header.split(';')`.
 *
 * @param node Call.
 */
function calledMethod(node: ESTree.CallExpression): Opt.Option<string> {
  return node.callee.type === 'MemberExpression' ? staticPropertyName(node.callee) : Opt.none();
}

function receiver(node: ESTree.CallExpression): Opt.Option<ESTree.Expression> {
  return node.callee.type === 'MemberExpression' && node.callee.object.type !== 'Super'
    ? Opt.some(node.callee.object)
    : Opt.none();
}

/**
 * Whether a call parses raw cookie text by hand: `cookieHeader.split(';')`, `document.cookie.match(/…/)` or
 * `/…/.exec(headers.get('cookie'))`.
 *
 * @param node Call.
 */
function isCookieParse(node: ESTree.CallExpression): boolean {
  return Opt.exists(calledMethod(node), (method) =>
    isParseMethod(method)
      ? Opt.exists(receiver(node), isCookieText)
      : method === 'exec' && Opt.exists(argumentAt(node, 0), isCookieText),
  );
}

/**
 * Whether a call looks for a cookie attribute in a Set-Cookie string: `cookie.includes('; Secure')`,
 * `Str.includes('HttpOnly')` or a named `includes` import from `effect/String`.
 *
 * @param node Call.
 * @param imports Effect imports of the file.
 */
function isAttributeCheck(node: ESTree.CallExpression, imports: ImportBindings): boolean {
  const method = Opt.orElse(calledMethod(node), () => imports.member(node.callee, 'String'));

  return (
    Opt.exists(method, isInspectMethod) &&
    Opt.exists(
      argumentAt(node, 0),
      (argument) => isStringLiteral(argument) && attributeProbePattern.test(argument.value),
    )
  );
}

/**
 * Whether a template interpolates a value into text with cookie attributes, as in `` `${name}=${value}; Path=/` ``.
 *
 * @param node Template literal.
 */
function isCookieTemplate(node: ESTree.TemplateLiteral): boolean {
  return (
    Arr.isReadonlyArrayNonEmpty(node.expressions) &&
    Arr.some(node.quasis, (quasi) => attributePattern.test(quasi.value.cooked ?? quasi.value.raw))
  );
}

function isAttributeLiteral(node: ESTree.Node): boolean {
  return isStringLiteral(node) && attributePattern.test(node.value);
}

export const preferEffectCookies = Rule.define({
  name: 'prefer-effect-cookies',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer the Effect Cookies module over parsing, building and inspecting cookie strings by hand.',
    messages: {
      documentCookie:
        'document.cookie is one unparsed string. Parse it with Cookies.parseHeader, and write cookies from the server with HttpServerResponse.setCookie.',
      parseCookies:
        'Read request cookies with HttpServerRequest cookies or schemaCookies, or parse a header with Cookies.parseHeader or Cookies.fromSetCookie, instead of splitting or matching it by hand.',
      serializeCookie:
        'Build cookies with Cookies.makeCookie and Cookies.serializeCookie, or HttpServerResponse.setCookie, which validate names, values and attributes.',
      inspectCookie:
        'Parse Set-Cookie headers with Cookies.fromSetCookie and read the attributes from Cookies.get(…).options, instead of searching the string for them.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/http/Cookies',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    function report(
      node: ESTree.Node,
      messageId: 'documentCookie' | 'inspectCookie' | 'parseCookies' | 'serializeCookie',
    ) {
      return ctx.report(Diagnostic.fromId({ node, messageId }));
    }

    /**
     * Whether a member reads or writes `document.cookie`, unless it is handed straight to a `Cookies` parser such as
     * `Cookies.parseHeader(document.cookie)`.
     *
     * @param node Member expression.
     */
    function isDocumentCookie(node: ESTree.MemberExpression) {
      const parsed = Opt.exists(
        parentOfType(node, 'CallExpression'),
        (call) => containsSame<ESTree.Node>(call.arguments, node) && Opt.isSome(imports.member(call.callee, 'Cookies')),
      );

      return !parsed && Opt.contains(staticPropertyName(node), 'cookie')
        ? isGlobalIdentifier(node.object, 'document')
        : Effect.succeed(false);
    }

    return Visitor.merge(
      Visitor.on('MemberExpression', (node) => Effect.when(report(node, 'documentCookie'), isDocumentCookie(node))),
      Visitor.on('CallExpression', (node) =>
        isCookieParse(node)
          ? report(node, 'parseCookies')
          : isAttributeCheck(node, imports)
            ? report(node, 'inspectCookie')
            : Effect.void,
      ),
      Visitor.on('TemplateLiteral', (node) =>
        isCookieTemplate(node) && node.parent.type !== 'TaggedTemplateExpression'
          ? report(node, 'serializeCookie')
          : Effect.void,
      ),
      // `token + '; HttpOnly'`. Two literals are a fixture, not serialization.
      Visitor.on('BinaryExpression', (node) =>
        node.operator === '+' &&
        ((isAttributeLiteral(node.right) && !isStringLiteral(node.left)) ||
          (isAttributeLiteral(node.left) && !isStringLiteral(node.right)))
          ? report(node, 'serializeCookie')
          : Effect.void,
      ),
    );
  },
});

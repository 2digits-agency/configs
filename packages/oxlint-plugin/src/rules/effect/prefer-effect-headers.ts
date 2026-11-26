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
  callReceiver,
  calledMethod,
  headerTextSource,
  isStringLiteral,
  staticPath,
  staticPropertyName,
  unwrapExpression,
  walkNodes,
} from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isGlobalIdentifier } from '../../internal/scope';
import type { ImportBindings } from '../../schemas/imports';
import { CookieHeader, InspectMethod, ParseMethod } from '../../schemas/platform';

const isParseMethod = Schema.is(ParseMethod);

const isInspectMethod = Schema.is(InspectMethod);

const isCookieHeader = Schema.is(CookieHeader);

/**
 * The text that follows the target of a Link header value: `>; rel=…`.
 */
const linkParamsPattern = /^>\s*;\s*rel=/iu;

const headersNamePattern = /headers$/iu;

/**
 * Whether an expression names a headers object: `headers`, `requestHeaders` or `response.headers`.
 */
const isHeadersObject = Match.type<ESTree.Node>().pipe(
  Match.discriminators('type')({
    Identifier: ({ name }) => headersNamePattern.test(name),
    MemberExpression: (member) => Opt.exists(staticPropertyName(member), (name) => headersNamePattern.test(name)),
  }),
  Match.orElse(Fn.constFalse),
);

/**
 * Whether a member reads the header `name` from a headers object: `response.headers.link` or `headers['vary']`.
 *
 * @param node Member expression.
 * @param name Header name, compared case-insensitively.
 */
function readsHeaderMember(node: ESTree.MemberExpression, name: string): boolean {
  return (
    Opt.exists(staticPropertyName(node), (property) => Str.toLowerCase(property) === Str.toLowerCase(name)) &&
    isHeadersObject(node.object)
  );
}

/**
 * Whether an expression holds a raw Link header: a `get('link')` header read, `headers.link`, or a binding named
 * `linkHeader`.
 *
 * @param node Expression.
 * @param imports Effect imports of the file.
 */
function isLinkText(node: ESTree.Expression, imports: ImportBindings): boolean {
  const source = headerTextSource(node);

  return source.type === 'Identifier'
    ? /^link_?header$/iu.test(source.name)
    : Opt.isSome(headerReadOwner(source, 'link', imports));
}

/**
 * Whether a call parses or searches a Link header by hand: `linkHeader.split(',')`,
 * `headers.get('link')?.includes('rel="next"')` or `/<([^>]*)>/.exec(headers.get('link'))`. Text that does not come
 * from a Link header, such as an HTML body with `rel="next"` links, is left alone.
 *
 * @param node Call.
 * @param imports Effect imports of the file.
 */
function isLinkParse(node: ESTree.CallExpression, imports: ImportBindings): boolean {
  function isLink(text: ESTree.Expression) {
    return isLinkText(text, imports);
  }

  return Opt.exists(calledMethod(node), (method) =>
    isParseMethod(method) || isInspectMethod(method)
      ? Opt.exists(callReceiver(node), isLink)
      : (method === 'exec' || method === 'test') && Opt.exists(argumentAt(node, 0), isLink),
  );
}

/**
 * Whether a template interpolates a target into a Link header value, as in `` `<${url}>; rel="next"` ``.
 *
 * @param node Template literal.
 */
function isLinkTemplate(node: ESTree.TemplateLiteral): boolean {
  return (
    Arr.isReadonlyArrayNonEmpty(node.expressions) &&
    Arr.some(node.quasis, (quasi) => linkParamsPattern.test(quasi.value.cooked ?? quasi.value.raw))
  );
}

/**
 * The destination, header name and value of a data-first Effect header setter: `Headers.set(headers, name, value)`,
 * `HttpClientRequest.setHeader(request, name, value)` or `HttpServerResponse.setHeader(response, name, value)`. A
 * pipeable setter has no destination in its arguments, so it is none.
 *
 * @param node Call.
 * @param imports Effect imports of the file.
 */
function setHeaderCall(
  node: ESTree.CallExpression,
  imports: ImportBindings,
): Opt.Option<readonly [destination: ESTree.Expression, name: string, value: ESTree.Expression]> {
  const isSetter =
    node.arguments.length === 3 &&
    (imports.isApi(node.callee, 'Headers', 'set') ||
      imports.isApi(node.callee, 'HttpClientRequest', 'setHeader') ||
      imports.isApi(node.callee, 'HttpServerResponse', 'setHeader'));

  return isSetter
    ? Opt.all([argumentAt(node, 0), Opt.filter(argumentAt(node, 1), isStringLiteral), argumentAt(node, 2)]).pipe(
        Opt.map(([destination, name, value]) => [destination, name.value, value] as const),
      )
    : Opt.none();
}

/**
 * The object a hand-written read of the header `name` reads from: `headers` for `headers.get('vary')` on a headers
 * object, `Headers.get(headers, 'vary')` with Effect's `Headers`, or `headers.vary`, and `response.headers` for
 * `response.headers.vary`. Other `get` calls, such as `url.searchParams.get('link')` or `Reflect.get(config, 'link')`,
 * are not header reads.
 *
 * @param node Node.
 * @param name Header name, compared case-insensitively.
 * @param imports Effect imports of the file.
 */
function headerReadOwner(node: ESTree.Node, name: string, imports: ImportBindings): Opt.Option<ESTree.Node> {
  function isName(argument: ESTree.Node) {
    return isStringLiteral(argument) && Str.toLowerCase(argument.value) === Str.toLowerCase(name);
  }

  if (node.type === 'CallExpression') {
    if (node.arguments.length === 1) {
      return Opt.contains(calledMethod(node), 'get') && Opt.exists(argumentAt(node, 0), isName)
        ? Opt.filter(callReceiver(node), isHeadersObject)
        : Opt.none();
    }

    return node.arguments.length === 2 &&
      imports.isApi(node.callee, 'Headers', 'get') &&
      Opt.exists(argumentAt(node, 1), isName)
      ? argumentAt(node, 0)
      : Opt.none();
  }

  return node.type === 'MemberExpression' && readsHeaderMember(node, name) ? Opt.some(node.object) : Opt.none();
}

const pathEquivalence = Arr.makeEquivalence(Str.Equivalence);

/**
 * Whether `owner` is the setter's destination or its `headers`, as `response.headers` is for `response`.
 *
 * @param owner Object a header read reads from.
 * @param destination Setter destination.
 */
function isDestination(owner: ESTree.Node, destination: ESTree.Expression): boolean {
  return Opt.getOrElse(
    Opt.zipWith(
      staticPath(owner),
      staticPath(destination),
      (ownerPath, destinationPath) =>
        pathEquivalence(ownerPath, destinationPath) ||
        pathEquivalence(ownerPath, Arr.append(destinationPath, 'headers')),
    ),
    Fn.constFalse,
  );
}

function hasComma(node: ESTree.Node): boolean {
  return (
    (isStringLiteral(node) && Str.includes(',')(node.value)) ||
    (node.type === 'TemplateElement' && Str.includes(',')(node.value.cooked ?? node.value.raw))
  );
}

/**
 * Whether a header value joins the destination's current value of the same header with another one by a comma: a
 * template, `+` or `join` that reads `name` from the destination, as in `` `${headers.get('vary')}, Accept` ``. Values
 * read from another object are copies, and values joined by another separator, as the `Cookie` header's `;`, are not
 * what `Headers.append` writes.
 *
 * @param destination Setter destination.
 * @param name Header name.
 * @param value Header value.
 * @param imports Effect imports of the file.
 */
function joinsCurrentValue(
  destination: ESTree.Expression,
  name: string,
  value: ESTree.Expression,
  imports: ImportBindings,
): boolean {
  const target = unwrapExpression(value);

  const isJoin =
    target.type === 'TemplateLiteral' ||
    (target.type === 'BinaryExpression' && target.operator === '+') ||
    (target.type === 'CallExpression' && Opt.contains(calledMethod(target), 'join'));

  return (
    isJoin &&
    walkNodes(target, hasComma) &&
    walkNodes(target, (node) =>
      Opt.exists(headerReadOwner(node, name, imports), (owner) => isDestination(owner, destination)),
    )
  );
}

export const preferEffectHeaders = Rule.define({
  name: 'prefer-effect-headers',
  meta: ruleMeta({
    type: 'suggestion',
    description:
      'Prefer immutable Effect Headers values and the Effect Headers helpers for Link headers and multi-value headers.',
    messages: {
      effectHeaders: 'Use Headers.fromInput to construct normalized, immutable Effect headers.',
      parseLink:
        'Read Link headers with HttpClientResponse.links or HttpClientResponse.link, or parse them with Headers.parseLink or Schema.LinkHeaderFromString, instead of splitting or matching the header by hand.',
      formatLink: 'Build Link header values with Headers.formatLink, which quotes the relation types and parameters.',
      appendHeader:
        'Add a value to a header with Headers.append, HttpClientRequest.appendHeader or HttpServerResponse.appendHeader instead of joining it with the current value by hand.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/unstable/http/Headers',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    function report(node: ESTree.Node, messageId: 'appendHeader' | 'effectHeaders' | 'formatLink' | 'parseLink') {
      return ctx.report(Diagnostic.fromId({ node, messageId }));
    }

    return Visitor.merge(
      Visitor.on('NewExpression', (node) =>
        Effect.when(report(node, 'effectHeaders'), isGlobalIdentifier(node.callee, 'Headers')),
      ),
      Visitor.on('CallExpression', (node) =>
        isLinkParse(node, imports)
          ? report(node, 'parseLink')
          : Opt.exists(
                setHeaderCall(node, imports),
                ([destination, name, value]) =>
                  !isCookieHeader(Str.toLowerCase(name)) && joinsCurrentValue(destination, name, value, imports),
              )
            ? report(node, 'appendHeader')
            : Effect.void,
      ),
      Visitor.on('TemplateLiteral', (node) =>
        isLinkTemplate(node) && node.parent.type !== 'TaggedTemplateExpression'
          ? report(node, 'formatLink')
          : Effect.void,
      ),
      // `'<' + url + '>; rel="next"'`. Two literals are a fixture, not a value built from data.
      Visitor.on('BinaryExpression', (node) =>
        node.operator === '+' &&
        isStringLiteral(node.right) &&
        linkParamsPattern.test(node.right.value) &&
        !isStringLiteral(node.left)
          ? report(node, 'formatLink')
          : Effect.void,
      ),
    );
  },
});

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
  staticPropertyName,
  unwrapExpression,
  walkNodes,
} from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isGlobalIdentifier } from '../../internal/scope';
import type { ImportBindings } from '../../schemas/imports';
import { InspectMethod, ParseMethod } from '../../schemas/platform';

const isParseMethod = Schema.is(ParseMethod);

const isInspectMethod = Schema.is(InspectMethod);

/**
 * A pagination relation in a Link header, as in `rel="next"` or `rel=last`.
 */
const paginationRelPattern = /rel="?(?:next|prev|previous|first|last)\b/iu;

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
 * Whether a call reads the header `name` by hand: `headers.get(name)` or `Headers.get(headers, name)`.
 *
 * @param node Call.
 * @param name Header name, compared case-insensitively.
 */
function readsHeader(node: ESTree.CallExpression, name: string): boolean {
  return (
    Opt.contains(calledMethod(node), 'get') &&
    Arr.some(
      node.arguments,
      (argument) => isStringLiteral(argument) && Str.toLowerCase(argument.value) === Str.toLowerCase(name),
    )
  );
}

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
 */
const isLinkSource = Match.type<ESTree.Expression>().pipe(
  Match.discriminators('type')({
    Identifier: ({ name }) => /^link_?header$/iu.test(name),
    MemberExpression: (member) => readsHeaderMember(member, 'link'),
    CallExpression: (call) => readsHeader(call, 'link'),
  }),
  Match.orElse(Fn.constFalse),
);

function isLinkText(node: ESTree.Expression): boolean {
  return isLinkSource(headerTextSource(node));
}

function isPaginationRel(node: ESTree.Node): boolean {
  return (
    (isStringLiteral(node) && paginationRelPattern.test(node.value)) ||
    (node.type === 'Literal' && 'regex' in node && paginationRelPattern.test(node.regex.pattern))
  );
}

/**
 * Whether a call parses a Link header by hand: `linkHeader.split(',')`, `/<([^>]*)>/.exec(headers.get('link'))`, or a
 * search for a pagination relation such as `part.includes('rel="next"')`, `part.match(/rel="next"/)` or
 * `/rel="next"/.test(part)`.
 *
 * @param node Call.
 */
function isLinkParse(node: ESTree.CallExpression): boolean {
  return Opt.exists(calledMethod(node), (method) =>
    isParseMethod(method)
      ? Opt.exists(callReceiver(node), isLinkText) || Opt.exists(argumentAt(node, 0), isPaginationRel)
      : method === 'exec' || method === 'test'
        ? Opt.exists(argumentAt(node, 0), isLinkText) || Opt.exists(callReceiver(node), isPaginationRel)
        : isInspectMethod(method) && Opt.exists(argumentAt(node, 0), isPaginationRel),
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
 * The header name and value of an Effect header setter: `Headers.set(headers, name, value)`,
 * `HttpClientRequest.setHeader` and `HttpServerResponse.setHeader`, data-first or pipeable.
 *
 * @param node Call.
 * @param imports Effect imports of the file.
 */
function setHeaderCall(
  node: ESTree.CallExpression,
  imports: ImportBindings,
): Opt.Option<readonly [name: string, value: ESTree.Expression]> {
  const isSetter =
    imports.isApi(node.callee, 'Headers', 'set') ||
    imports.isApi(node.callee, 'HttpClientRequest', 'setHeader') ||
    imports.isApi(node.callee, 'HttpServerResponse', 'setHeader');

  const offset = node.arguments.length === 3 ? 1 : 0;

  return isSetter
    ? Opt.zipWith(
        Opt.filter(argumentAt(node, offset), isStringLiteral),
        argumentAt(node, offset + 1),
        (name, value) => [name.value, value] as const,
      )
    : Opt.none();
}

/**
 * Whether a header value joins the current value of the same header with another one: a template, `+` or `join` that
 * reads `name`, as in `` `${headers.get('vary')}, Accept` ``.
 *
 * @param value Header value.
 * @param name Header name.
 */
function joinsCurrentValue(value: ESTree.Expression, name: string): boolean {
  const target = unwrapExpression(value);

  const isJoin =
    target.type === 'TemplateLiteral' ||
    (target.type === 'BinaryExpression' && target.operator === '+') ||
    (target.type === 'CallExpression' && Opt.contains(calledMethod(target), 'join'));

  return (
    isJoin &&
    walkNodes(
      target,
      (node) =>
        (node.type === 'CallExpression' && readsHeader(node, name)) ||
        (node.type === 'MemberExpression' && readsHeaderMember(node, name)),
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
        isLinkParse(node)
          ? report(node, 'parseLink')
          : Opt.exists(
                setHeaderCall(node, imports),
                ([name, value]) => Str.toLowerCase(name) !== 'set-cookie' && joinsCurrentValue(value, name),
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

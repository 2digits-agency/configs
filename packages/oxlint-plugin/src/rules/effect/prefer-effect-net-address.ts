/* oxlint-disable 2digits/prefer-effect-net-address -- The patterns below describe the IP text this rule reports. */
import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as HashSet from 'effect/HashSet';
import * as Opt from 'effect/Option';
import * as Ref from 'effect/Ref';
import * as Schema from 'effect/Schema';

import { argumentAt, isEqualityOperator, isStringLiteral, parentOf, staticPropertyName } from '../../internal/ast';
import { importBindings, moduleImportMember } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

const IpLibrary = Schema.Literals([
  'ip',
  'ip-address',
  'ip-range-check',
  'ip-regex',
  'ipaddr.js',
  'is-ip',
  'is-localhost-ip',
  'netmask',
  'private-ip',
]);

const isIpLibrary = Schema.is(IpLibrary);

const NodeIpCheck = Schema.Literals(['isIP', 'isIPv4', 'isIPv6']);

const isNodeIpCheck = Schema.is(NodeIpCheck);

const netSources: ReadonlyArray<string> = ['net', 'node:net'];

/**
 * Special-purpose addresses that code compares against as text.
 */
const SpecialIpLiteral = Schema.Literals(['0.0.0.0', '127.0.0.1', '255.255.255.255', '::', '::1']);

const isSpecialIpLiteral = Schema.is(SpecialIpLiteral);

/**
 * Prefixes of special-purpose IPv4 ranges and IPv6 link-local or IPv4-mapped addresses, as passed to `startsWith`.
 */
const specialIpPrefix =
  /^(?:(?:0|10|127|169\.254|192\.168|172\.(?:1[6-9]|2\d|3[01])|100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7]))\.|fe80:|::ffff:)$/iu;

/**
 * Regular expression sources that match IP text: a dotted quad such as `\d{1,3}\.` three times, `(\d+\.){3}`, or an
 * octet range `25[0-5]` in a pattern that also matches a dot; an anchored special-purpose IPv4 prefix such as `^10\.`
 * or `^(?:127|169\.254)\.`; or an IPv6 link-local, unique-local or IPv4-mapped prefix.
 */
const ipPatterns: ReadonlyArray<RegExp> = [
  /(?:(?:\\d|\[0-9\])(?:\+|\{1,3\})\\\.){3}/u,
  /\((?:\?:)?(?:\\d|\[0-9\])(?:\+|\{1,3\})\\\.\)\{3\}/u,
  /^(?=[\s\S]*25\[0-5\])(?=[\s\S]*\\\.)/u,
  /^\^(?:\(\?:)?(?:0|10|100|127|169\\\.254|172|192\\\.168)(?:\|(?:0|10|100|127|169\\\.254|172|192\\\.168))*\)?\\\./u,
  /^\^\(?(?:\?:)?(?:fe80|fe\[89ab\]|f\[cd\]|fc\|fd|fd\|fc)/iu,
  /::ffff:/iu,
];

function isIpComparison(node: ESTree.BinaryExpression): boolean {
  return (
    isEqualityOperator(node.operator) &&
    Arr.some([node.left, node.right], (side) => isStringLiteral(side) && isSpecialIpLiteral(side.value))
  );
}

/**
 * The statement at the top of the program that holds `node`, so one hand-written classifier is reported once.
 *
 * @param node Node inside the program.
 */
function topLevelStatement(node: ESTree.Node): ESTree.Node {
  return Opt.match(parentOf(node), {
    onNone: () => node,
    onSome: (parent) => (parent.type === 'Program' ? node : topLevelStatement(parent)),
  });
}

export const preferEffectNetAddress = Rule.define({
  name: 'prefer-effect-net-address',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Effect NetAddress over IP addresses parsed and classified by hand in Effect projects.',
    messages: {
      ipText:
        'Parse the address with NetAddress.ipFromString and classify it with NetAddress.isLoopback, isPrivate, isLinkLocal, isUniqueLocal, isUnspecified or isIpv4Mapped, or IpNetwork.contains, instead of matching IP text by hand.',
      nodeIpCheck:
        'Use NetAddress.ipFromString, ipv4FromString or ipv6FromString from effect/net instead of net.{{name}}: they return a typed address to classify.',
      library: 'Use NetAddress and IpNetwork from effect/net instead of {{source}}.',
    },
    url: 'https://effect.website/docs/v4/api/effect/net/NetAddress',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    const reportedStatements = yield* Ref.make(HashSet.empty<number>());

    function reportIpText(node: ESTree.Node) {
      const [start] = topLevelStatement(node).range;

      return Effect.gen(function* () {
        const reported = yield* Ref.get(reportedStatements);

        if (HashSet.has(reported, start)) {
          return;
        }

        yield* Ref.update(reportedStatements, HashSet.add(start));

        yield* ctx.report(Diagnostic.fromId({ node, messageId: 'ipText' }));
      });
    }

    /**
     * Whether a call is `x.startsWith('127.')` or `Str.startsWith('127.')` with a special-purpose prefix.
     *
     * @param node Call.
     */
    function isIpPrefixCheck(node: ESTree.CallExpression): boolean {
      const isStartsWith =
        (node.callee.type === 'MemberExpression' && Opt.contains(staticPropertyName(node.callee), 'startsWith')) ||
        imports.isApi(node.callee, 'String', 'startsWith');

      return (
        isStartsWith &&
        Opt.exists(argumentAt(node, 0), (argument) => isStringLiteral(argument) && specialIpPrefix.test(argument.value))
      );
    }

    return Visitor.merge(
      Visitor.on('ImportDeclaration', ({ source }) =>
        isIpLibrary(source.value)
          ? ctx.report(Diagnostic.fromId({ node: source, messageId: 'library', data: { source: source.value } }))
          : Effect.void,
      ),
      Visitor.on('CallExpression', (node) =>
        moduleImportMember(ctx.sourceCode, node.callee, netSources).pipe(
          Opt.filter(isNodeIpCheck),
          Opt.match({
            onNone: () => (isIpPrefixCheck(node) ? reportIpText(node) : Effect.void),
            onSome: (name) => ctx.report(Diagnostic.fromId({ node, messageId: 'nodeIpCheck', data: { name } })),
          }),
        ),
      ),
      Visitor.on('Literal', (node) =>
        'regex' in node && Arr.some(ipPatterns, (pattern) => pattern.test(node.regex.pattern))
          ? reportIpText(node)
          : Effect.void,
      ),
      Visitor.on('BinaryExpression', (node) => (isIpComparison(node) ? reportIpText(node) : Effect.void)),
    );
  },
});

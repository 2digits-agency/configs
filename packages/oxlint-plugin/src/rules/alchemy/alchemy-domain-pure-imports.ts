import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { argumentAt, isStringLiteral } from '../../internal/ast';
import { ruleMeta } from '../../internal/meta';
import { isGlobalIdentifier } from '../../internal/scope';

const DomainFileName = Schema.String.check(
  Schema.isPattern(
    /\.(?:aggregate|api|command|context|event|external|id|middleware|model|policy|projection|rejection|saga|stream|view)\.[cm]?tsx?$/u,
  ),
);

const isDomainFileName = Schema.is(DomainFileName);

const domainPackage = '@alchemy.run/domain';

function isAllowed(source: string): boolean {
  return (
    Str.startsWith('.')(source) ||
    source === 'effect' ||
    Str.startsWith('effect/')(source) ||
    source === domainPackage ||
    Str.startsWith(`${domainPackage}/`)(source)
  );
}

function importsDomain(program: ESTree.Program): boolean {
  return Arr.some(
    program.body,
    (statement) => statement.type === 'ImportDeclaration' && statement.source.value === domainPackage,
  );
}

export const alchemyDomainPureImports = Rule.define({
  name: 'alchemy-domain-pure-imports',
  meta: ruleMeta({
    type: 'problem',
    description:
      'Restrict Alchemy Domain block files to imports from `@alchemy.run/domain`, `effect` and the domain package itself.',
    messages: {
      import:
        'A domain block imports only `@alchemy.run/domain`, `effect` and relative files, not `{{source}}`. Put code that touches infrastructure in the server package.',
      dynamic:
        'A domain block imports only `@alchemy.run/domain`, `effect` and relative files, so its import sources must be string literals.',
    },
    url: 'https://alchemy.run/domain',
  }),
  *create() {
    const ctx = yield* RuleContext;

    if (!isDomainFileName(ctx.filename) || !importsDomain(ctx.sourceCode.ast)) {
      return {};
    }

    function reportImport(node: ESTree.Node, source: string) {
      return isAllowed(source)
        ? Effect.void
        : ctx.report(Diagnostic.fromId({ node, messageId: 'import', data: { source } }));
    }

    function check(node: ESTree.ImportDeclaration | ESTree.ExportAllDeclaration | ESTree.ExportNamedDeclaration) {
      return P.isNull(node.source) ? Effect.void : reportImport(node.source, node.source.value);
    }

    function checkSource(source: ESTree.Node) {
      return isStringLiteral(source)
        ? reportImport(source, source.value)
        : ctx.report(Diagnostic.fromId({ node: source, messageId: 'dynamic' }));
    }

    return Visitor.merge(
      Visitor.on('ImportDeclaration', check),
      Visitor.on('ExportAllDeclaration', check),
      Visitor.on('ExportNamedDeclaration', check),
      Visitor.on('ImportExpression', (node) => checkSource(node.source)),
      Visitor.on('TSImportEqualsDeclaration', (node) =>
        node.moduleReference.type === 'TSExternalModuleReference'
          ? checkSource(node.moduleReference.expression)
          : Effect.void,
      ),
      Visitor.on('CallExpression', (node) =>
        Opt.match(argumentAt(node, 0), {
          onNone: () => Effect.void,
          onSome: (source) =>
            Effect.flatMap(isGlobalIdentifier(node.callee, 'require'), (isRequire) =>
              isRequire ? checkSource(source) : Effect.void,
            ),
        }),
      ),
    );
  },
});

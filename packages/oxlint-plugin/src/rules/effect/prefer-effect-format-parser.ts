import { Diagnostic, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as R from 'effect/Record';

import { moduleExportName, parentOf, staticPropertyName } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';
import { isTypeOnlyImport } from './internal/import-style';

interface FormatPackage {
  /**
   * The `effect/encoding` module that replaces the package.
   */
  readonly module: string;
  /**
   * The exports it replaces, or `all` when it replaces the whole package. Effect's Yaml, Toml, Ini, Json5 and Jsonc
   * only parse, so their packages' serializers stay allowed.
   */
  readonly members: 'all' | ReadonlyArray<string>;
}

const yaml: FormatPackage = { module: 'Yaml', members: ['load', 'parse', 'parseAllDocuments', 'parseDocument'] };

const toml: FormatPackage = { module: 'Toml', members: ['parse'] };

const csv: FormatPackage = { module: 'Csv', members: 'all' };

const xml: FormatPackage = { module: 'Xml', members: 'all' };

const formatPackages: Readonly<Record<string, FormatPackage>> = {
  '@fast-csv/format': csv,
  '@fast-csv/parse': csv,
  '@iarna/toml': toml,
  '@streamparser/json': { module: 'JsonArray', members: 'all' },
  '@xmldom/xmldom': { module: 'Xml', members: ['DOMParser'] },
  'comment-json': { module: 'Jsonc', members: ['parse'] },
  'csv-parse': csv,
  'csv-parse/sync': csv,
  'csv-parser': csv,
  'csv-stringify': csv,
  'csv-stringify/sync': csv,
  'fast-csv': csv,
  'fast-xml-parser': { module: 'Xml', members: ['XMLParser'] },
  ini: { module: 'Ini', members: ['decode', 'parse'] },
  'js-yaml': yaml,
  json5: { module: 'Json5', members: ['parse'] },
  'jsonc-parser': { module: 'Jsonc', members: ['parse'] },
  ndjson: { module: 'Ndjson', members: 'all' },
  papaparse: csv,
  sax: xml,
  'smol-toml': toml,
  'stream-json': { module: 'JsonArray', members: 'all' },
  'strip-json-comments': { module: 'Jsonc', members: 'all' },
  toml,
  xml2js: { module: 'Xml', members: ['Parser', 'parseString', 'parseStringPromise'] },
  yaml,
};

function replaces(format: FormatPackage, member: string): boolean {
  return format.members === 'all' || Arr.contains(format.members, member);
}

export const preferEffectFormatParser: CreateRule = defineRule({
  name: 'prefer-effect-format-parser',
  meta: ruleMeta({
    type: 'suggestion',
    description:
      'Prefer the effect/encoding modules over third-party YAML, TOML, INI, JSON5, JSONC, CSV, NDJSON, JSON array and XML parsers in Effect files.',
    messages: {
      effectFormat: 'Use {{module}} from effect/encoding instead of {{api}}.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/encoding',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    function report(node: ESTree.Node, format: FormatPackage, api: string) {
      return ctx.report(Diagnostic.fromId({ node, messageId: 'effectFormat', data: { module: format.module, api } }));
    }

    // `yaml.parse(...)` through a default or namespace import of a package whose serializers stay allowed.
    function reportMemberUses(specifier: ESTree.Node, format: FormatPackage, source: string) {
      const uses = Arr.flatMap(ctx.sourceCode.getDeclaredVariables(specifier), ({ references }) =>
        Arr.getSomes(
          Arr.map(references, ({ identifier }) =>
            Opt.flatMap(
              Opt.filter(
                parentOf(identifier),
                (parent): parent is ESTree.MemberExpression =>
                  parent.type === 'MemberExpression' && parent.object === identifier,
              ),
              (member) =>
                Opt.map(
                  Opt.filter(staticPropertyName(member), (name) => replaces(format, name)),
                  (name) => [member, `${source} ${name}`] as const,
                ),
            ),
          ),
        ),
      );

      // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
      return Effect.forEach(uses, ([member, api]) => report(member, format, api), { discard: true });
    }

    function reportSpecifier(
      declaration: ESTree.ImportDeclaration,
      specifier: ESTree.ImportDeclaration['specifiers'][number],
      format: FormatPackage,
    ) {
      const source = declaration.source.value;

      if (specifier.type === 'ImportSpecifier') {
        const name = moduleExportName(specifier.imported);

        return !isTypeOnlyImport(declaration, specifier) && replaces(format, name)
          ? report(specifier, format, `${source} ${name}`)
          : Effect.void;
      }

      return format.members === 'all' ? report(specifier, format, source) : reportMemberUses(specifier, format, source);
    }

    return Visitor.on('ImportDeclaration', (declaration) =>
      Opt.match(R.get(formatPackages, declaration.source.value), {
        onNone: () => Effect.void,
        onSome: (format) =>
          isTypeOnlyImport(declaration)
            ? Effect.void
            : // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
              Effect.forEach(declaration.specifiers, (specifier) => reportSpecifier(declaration, specifier, format), {
                discard: true,
              }),
      }),
    );
  },
});

import { RuleContext, type ESTree, type OxlintSourceCode } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';
import * as Tuple from 'effect/Tuple';

import { EffectSource, ImportBindings } from '../schemas/imports';
import { moduleExportName, staticPath } from './ast';
import { isImportedApiIn } from './scope';

const isEffectSource = Schema.is(EffectSource);

/**
 * Lowercase entrypoints such as `effect/unstable/http` are barrels whose named imports are module namespaces, while
 * PascalCase entrypoints such as `effect/Schema` are the module itself.
 *
 * @param source Import source.
 */
function submodulePath(source: string): ReadonlyArray<string> {
  const name = Arr.lastNonEmpty(Str.split(source, '/'));

  return /^\p{Ll}/u.test(name) ? [] : [name];
}

const modulePath = Match.type<string>().pipe(
  Match.when('alchemy', () => Opt.some<ReadonlyArray<string>>(['Alchemy'])),
  Match.when('@alchemy.run/domain', () => Opt.some<ReadonlyArray<string>>(['Domain'])),
  Match.when(Match.is('effect', '@effect/platform'), () => Opt.some<ReadonlyArray<string>>([])),
  Match.whenOr(Str.startsWith('effect/'), Str.startsWith('alchemy/'), Str.startsWith('@effect/'), (source) =>
    Opt.some(submodulePath(source)),
  ),
  Match.orElse(() => Opt.none<ReadonlyArray<string>>()),
);

function specifierBindings(
  declaration: ESTree.ImportDeclaration,
  path: ReadonlyArray<string>,
): ReadonlyArray<readonly [string, ReadonlyArray<string>]> {
  return Arr.map(declaration.specifiers, (specifier) =>
    Tuple.make(
      specifier.local.name,
      specifier.type === 'ImportSpecifier' ? [...path, moduleExportName(specifier.imported)] : path,
    ),
  );
}

/**
 * Collect the import bindings of a program from its top-level import declarations.
 *
 * @param program Program.
 */
function collectImportBindings(program: ESTree.Program): ImportBindings {
  const declarations = Arr.filter(
    program.body,
    (statement): statement is ESTree.ImportDeclaration => statement.type === 'ImportDeclaration',
  );

  return ImportBindings.make({
    bindings: new Map(
      Arr.flatMap(declarations, (declaration) =>
        Opt.match(modulePath(declaration.source.value), {
          onNone: () => [],
          onSome: (path) => specifierBindings(declaration, path),
        }),
      ),
    ),
    hasEffectImport: Arr.some(declarations, (declaration) => isEffectSource(declaration.source.value)),
  });
}

/**
 * The export of a non-Effect module, such as `node:os`, that a call's callee names: `homedir` for `homedir()` after
 * `import { homedir } from 'node:os'`, or for `os.homedir()` after a default or namespace import. Shadowed names are
 * none.
 *
 * @param sourceCode Source of the file.
 * @param callee Callee to resolve.
 * @param sources Module specifiers, such as `['os', 'node:os']`.
 */
export function moduleImportMember(
  sourceCode: OxlintSourceCode,
  callee: ESTree.Node,
  sources: ReadonlyArray<string>,
): Opt.Option<string> {
  const specifiers = Arr.flatMap(sourceCode.ast.body, (statement) =>
    statement.type === 'ImportDeclaration' && Arr.contains(sources, statement.source.value) ? statement.specifiers : [],
  );

  const member = Opt.flatMap(staticPath(callee), ([root, ...rest]) =>
    Opt.flatMap(
      Arr.findFirst(specifiers, ({ local }) => local.name === root),
      (specifier): Opt.Option<string> =>
        specifier.type === 'ImportSpecifier'
          ? Arr.isReadonlyArrayEmpty(rest)
            ? Opt.some(moduleExportName(specifier.imported))
            : Opt.none()
          : rest.length === 1
            ? Arr.head(rest)
            : Opt.none(),
    ),
  );

  return Opt.filter(member, () => isImportedApiIn(sourceCode, callee));
}

/**
 * The import bindings of the file being linted.
 */
export const importBindings: Effect.Effect<ImportBindings, never, RuleContext> = Effect.map(
  Effect.service(RuleContext),
  (context) => collectImportBindings(context.sourceCode.ast),
);

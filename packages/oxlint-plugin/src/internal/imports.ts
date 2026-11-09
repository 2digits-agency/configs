import { RuleContext, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';
import * as Tuple from 'effect/Tuple';

import { moduleExportName, staticPath } from './ast';

const ModulePath = Schema.Array(Schema.String);

/**
 * The member a two-part module path names in `namespace`, such as `map` for `['Effect', 'map']`.
 *
 * @param path Module path.
 * @param namespace Module namespace, such as `Effect`.
 */
export function namespaceMember(path: ReadonlyArray<string>, namespace: string): Opt.Option<string> {
  return path.length === 2 && Opt.contains(Arr.head(path), namespace) ? Arr.get(path, 1) : Opt.none();
}

/**
 * The Effect and Alchemy imports of one file: the module path each local binding names, such as `['Effect', 'map']` for
 * `import { map } from 'effect/Effect'`, and whether the file imports Effect at all.
 */
export class ImportBindings extends Schema.Class<ImportBindings, { readonly brand: unique symbol }>('ImportBindings')({
  bindings: Schema.ReadonlyMap(Schema.String, ModulePath),
  hasEffectImport: Schema.Boolean,
}) {
  /**
   * The module path an expression names through an import, such as `['Schema', 'Struct']` for `S.Struct`.
   *
   * @param node Callee or reference.
   */
  path(node: ESTree.Node): Opt.Option<ReadonlyArray<string>> {
    return Opt.flatMap(staticPath(node), ([first, ...rest]) =>
      Opt.map(Opt.fromNullishOr(this.bindings.get(first)), (imported) => [...imported, ...rest]),
    );
  }

  /**
   * Whether an expression names `namespace.member`, or any of several members.
   *
   * @param node Callee or reference.
   * @param namespace Module namespace, such as `Effect`.
   * @param member Accepted member name or names.
   */
  isApi(node: ESTree.Node, namespace: string, member: string | ReadonlyArray<string>): boolean {
    const members = Str.isString(member) ? [member] : member;

    return Opt.exists(this.member(node, namespace), (name) => Arr.contains(members, name));
  }

  /**
   * The member of `namespace` an expression names, such as `map` for `Effect.map`.
   *
   * @param node Callee or reference.
   * @param namespace Module namespace, such as `Effect`.
   */
  member(node: ESTree.Node, namespace: string): Opt.Option<string> {
    return Opt.flatMap(this.path(node), (path) => namespaceMember(path, namespace));
  }

  /**
   * Whether an expression names exactly the module path `expected`.
   *
   * @param node Callee or reference.
   * @param expected Full module path.
   */
  isApiPath(node: ESTree.Node, expected: ReadonlyArray<string>): boolean {
    return Opt.exists(this.path(node), (path) => Arr.makeEquivalence(Str.Equivalence)(path, expected));
  }
}

const EffectSource = Schema.String.check(Schema.isPattern(/^(?:effect(?:\/.*)?|@effect\/.*)$/u));

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
 * The import bindings of the file being linted.
 */
export const importBindings: Effect.Effect<ImportBindings, never, RuleContext> = Effect.map(
  Effect.service(RuleContext),
  (context) => collectImportBindings(context.sourceCode.ast),
);

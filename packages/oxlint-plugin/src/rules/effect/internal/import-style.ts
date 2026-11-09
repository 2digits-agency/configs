import type { ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as R from 'effect/Record';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

const effectImportAliases: Readonly<Record<string, string>> = {
  Array: 'Arr',
  Boolean: 'Bool',
  Equal: 'Eq',
  Function: 'Fn',
  Number: 'Num',
  Option: 'Opt',
  Predicate: 'P',
  Record: 'R',
  String: 'Str',
};

/**
 * Effect and Alchemy module namespaces are PascalCase; lowercase and SCREAMING_SNAKE exports such as `ALCHEMY_DEV` are
 * plain values.
 */
const ModuleName = Schema.String.check(Schema.isPattern(/^\p{Lu}[^_]*$/u));

export const isModuleName = Schema.is(ModuleName);

const EffectVitestSource = Schema.String.check(Schema.isPattern(/^@effect\/vitest(?:\/.*)?$/u));

const isEffectVitestSource = Schema.is(EffectVitestSource);

/**
 * A scoped Effect package root such as `@effect/platform`, whose named imports are module namespaces.
 */
const EffectPackageRoot = Schema.String.check(Schema.isPattern(/^@effect\/[^/]+$/u));

const isEffectPackageRoot = Schema.is(EffectPackageRoot);

const EffectPackageSubmodule = Schema.String.check(Schema.isPattern(/^@effect\/[^/]+\//u));

const isEffectPackageSubmodule = Schema.is(EffectPackageSubmodule);

export function isTypeOnlyImport(declaration: ESTree.ImportDeclaration, specifier?: ESTree.ImportSpecifier): boolean {
  return declaration.importKind === 'type' || specifier?.importKind === 'type';
}

export function namespaceAlias(moduleName: string): string {
  return Opt.getOrElse(R.get(effectImportAliases, moduleName), () => moduleName);
}

/**
 * The submodule entrypoint of a barrel module export, such as `effect/Schema` for `Schema` from `effect`.
 *
 * @param source Barrel import source.
 * @param moduleName Exported module name.
 */
export function barrelModuleSource(source: string, moduleName: string): Opt.Option<string> {
  return Match.value(source).pipe(
    Match.when(Match.is('effect', 'alchemy'), () => Opt.some(`${source}/${moduleName}`)),
    Match.when(
      (value) => isEffectPackageRoot(value) && !isEffectVitestSource(value),
      () => Opt.some(`${source}/${moduleName}`),
    ),
    Match.orElse(() => Opt.none()),
  );
}

/**
 * The module an Effect or Alchemy submodule entrypoint exports, such as `Schema` for `effect/Schema`.
 *
 * @param source Import source.
 */
export function submoduleName(source: string): Opt.Option<string> {
  const isSubmodule =
    !isEffectVitestSource(source) &&
    (Str.startsWith('effect/')(source) || Str.startsWith('alchemy/')(source) || isEffectPackageSubmodule(source));

  return isSubmodule ? Opt.liftPredicate(Arr.lastNonEmpty(Str.split(source, '/')), isModuleName) : Opt.none();
}

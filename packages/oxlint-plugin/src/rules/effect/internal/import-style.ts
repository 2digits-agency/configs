import type { ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as R from 'effect/Record';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { EffectPackageRoot, EffectPackageSubmodule, EffectVitestSource } from '../../../schemas/imports';
import { ModuleName } from '../../../schemas/names';

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

export const isModuleName = Schema.is(ModuleName);

const isEffectVitestSource = Schema.is(EffectVitestSource);

const isEffectPackageRoot = Schema.is(EffectPackageRoot);

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

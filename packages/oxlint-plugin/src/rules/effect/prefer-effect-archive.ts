import { Diagnostic, Rule, RuleContext, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as R from 'effect/Record';
import * as Schema from 'effect/Schema';

import { moduleExportName } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { onRuntimeImport, packageName } from './internal/package-imports';

/**
 * Archive codecs and the `effect/encoding` module that replaces each. Packages that extract to or pack from disk, such
 * as `tar`, `tar-fs` and `extract-zip`, are left out: they guard against path traversal and symlinks, which `Tar` and
 * `Zip` leave to the caller.
 */
const archivePackages: Readonly<Record<string, string>> = {
  '@zip.js/zip.js': 'Zip',
  'adm-zip': 'Zip',
  archiver: 'Zip or Tar',
  'client-zip': 'Zip',
  jszip: 'Zip',
  'js-untar': 'Tar',
  'modern-tar': 'Tar',
  nanotar: 'Tar',
  'node-stream-zip': 'Zip',
  'tar-js': 'Tar',
  'tar-stream': 'Tar',
  unzipper: 'Zip',
  yauzl: 'Zip',
  'yauzl-promise': 'Zip',
  yazl: 'Zip',
  'zip-stream': 'Zip',
};

/**
 * The zip exports of `fflate`, which also exports gzip, zlib and raw deflate codecs that `Zip` does not replace.
 */
const FflateZipExport = Schema.Literals([
  'AsyncUnzipInflate',
  'AsyncZipDeflate',
  'Unzip',
  'UnzipInflate',
  'UnzipPassThrough',
  'Zip',
  'ZipDeflate',
  'ZipPassThrough',
  'unzip',
  'unzipSync',
  'zip',
  'zipSync',
]);

const isFflateZipExport = Schema.is(FflateZipExport);

function fflateZipImports(declaration: Opt.Option<ESTree.ImportDeclaration>): ReadonlyArray<ESTree.ImportSpecifier> {
  return Opt.match(declaration, {
    onNone: () => [],
    onSome: ({ specifiers }) =>
      Arr.filter(
        specifiers,
        (specifier): specifier is ESTree.ImportSpecifier =>
          specifier.type === 'ImportSpecifier' &&
          specifier.importKind !== 'type' &&
          isFflateZipExport(moduleExportName(specifier.imported)),
      ),
  });
}

export const preferEffectArchive = Rule.define({
  name: 'prefer-effect-archive',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Effect Tar and Zip over tar and zip libraries in Effect projects.',
    messages: {
      archive:
        'Use {{module}} from effect/encoding instead of {{source}}: its decode and encode channels stream entries without buffering whole bodies.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/encoding/Zip',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    function report(node: ESTree.Node, source: string, module: string) {
      return ctx.report(Diagnostic.fromId({ node, messageId: 'archive', data: { module, source } }));
    }

    return onRuntimeImport((source, declaration) => {
      const name = packageName(source.value);

      if (name !== 'fflate') {
        return Opt.match(R.get(archivePackages, name), {
          onNone: () => Effect.void,
          onSome: (module) => report(source, source.value, module),
        });
      }

      // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
      return Effect.forEach(fflateZipImports(declaration), (specifier) => report(specifier, 'fflate', 'Zip'), {
        discard: true,
      });
    });
  },
});

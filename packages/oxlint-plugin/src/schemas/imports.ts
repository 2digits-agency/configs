import type { ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { namespaceMember, staticPath } from '../internal/ast';

export const EffectSource = Schema.String.check(Schema.isPattern(/^(?:effect(?:\/.*)?|@effect\/.*)$/u));

/**
 * Scoped Effect packages whose named imports stay named: `@effect/vitest` and the Effect Atom packages such as
 * `@effect/atom-react`, whose hooks read badly through a namespace.
 */
export const NamedImportEffectSource = Schema.String.check(
  Schema.isPattern(/^@effect\/(?:vitest|atom(?:-[^/]+)?)(?:\/.*)?$/u),
);

/**
 * A scoped Effect package root such as `@effect/platform`, whose named imports are module namespaces.
 */
export const EffectPackageRoot = Schema.String.check(Schema.isPattern(/^@effect\/[^/]+$/u));

export const EffectPackageSubmodule = Schema.String.check(Schema.isPattern(/^@effect\/[^/]+\//u));

export const RelativeSource = Schema.String.check(Schema.isPattern(/^\.\.?\//u));

const FileSystemModule = Schema.Literals(['fs', 'fs/promises']);

export const NodeFileSystemSource = Schema.Union([
  FileSystemModule,
  Schema.TemplateLiteral(['node:', FileSystemModule]),
]);

const PathModule = Schema.Literal('path');

export const NodePathSource = Schema.Union([PathModule, Schema.TemplateLiteral(['node:', PathModule])]);

export const JwtLibrary = Schema.Literals([
  '@tsndr/cloudflare-worker-jwt',
  'fast-jwt',
  'hono/jwt',
  'jose',
  'jsonwebtoken',
  'jwt-decode',
  'jwt-simple',
]);

export const IpLibrary = Schema.Literals([
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

/**
 * Server-Sent Events clients, parsers and server helpers that `Sse` with `HttpClient`, `HttpServerResponse` or
 * `HttpApiSchema.StreamSse` replaces.
 */
export const SsePackage = Schema.Literals([
  '@microsoft/fetch-event-source',
  'better-sse',
  'event-source-polyfill',
  'eventsource',
  'eventsource-client',
  'eventsource-parser',
  'extended-eventsource',
  'fetch-event-stream',
  'reconnecting-eventsource',
  'sse.js',
]);

export const DirectoryLibrary = Schema.Literals([
  'appdirsjs',
  'application-config-path',
  'env-paths',
  'os-homedir',
  'platform-folders',
  'user-home',
  'xdg-app-paths',
  'xdg-basedir',
]);

/**
 * The zip exports of `fflate`, which also exports gzip, zlib and raw deflate codecs that `Zip` does not replace.
 */
export const FflateZipExport = Schema.Literals([
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

const ModulePath = Schema.Array(Schema.String);

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
      Opt.fromNullishOr(this.bindings.get(first)).pipe(Opt.map((imported) => [...imported, ...rest])),
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
    return Opt.flatMap(this.path(node), namespaceMember(namespace));
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

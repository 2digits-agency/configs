import * as Schema from 'effect/Schema';
/* oxlint-disable 2digits/prefer-effect-net-address -- SpecialIpLiteral describes the IP text that rule reports. */
import type * as HttpApiEndpoint from 'effect/http-api/HttpApiEndpoint';

type StringMethodName = keyof string;

type GlobalName = keyof typeof globalThis;

export const StringMethod = Schema.Literals([
  'replace',
  'replaceAll',
  'slice',
  'split',
  'substr',
  'substring',
] satisfies ReadonlyArray<StringMethodName>);

export const ReplaceMethod = StringMethod.pick(['replace', 'replaceAll']);

export const ParseMethod = Schema.Literals(['split', 'match', 'matchAll'] satisfies ReadonlyArray<StringMethodName>);

export const InspectMethod = Schema.Literals([
  'includes',
  'startsWith',
  'endsWith',
] satisfies ReadonlyArray<StringMethodName>);

/**
 * Array methods that call their callback synchronously, so a callback created during render also runs during it.
 */
export const SynchronousArrayMethod = Schema.Literals([
  'every',
  'filter',
  'find',
  'findIndex',
  'findLast',
  'findLastIndex',
  'flatMap',
  'forEach',
  'map',
  'reduce',
  'reduceRight',
  'some',
  'sort',
  'toSorted',
] satisfies ReadonlyArray<keyof Array<unknown>>);

export const PromiseChainMethod = Schema.Literals(['catch', 'finally', 'then'] satisfies ReadonlyArray<
  keyof Promise<unknown>
>);

export const KeyedMethod = Schema.Literals(['delete', 'get', 'has', 'set'] satisfies ReadonlyArray<
  keyof Map<unknown, unknown>
>);

export const UrlParseMethod = Schema.Literals(['canParse', 'parse'] satisfies ReadonlyArray<keyof typeof URL>);

export const BrowserGlobal = Schema.Literals([
  'document',
  'localStorage',
  'navigator',
  'sessionStorage',
  'window',
] satisfies ReadonlyArray<GlobalName>);

export const GlobalBase64Name = Schema.Literals(['atob', 'btoa'] satisfies ReadonlyArray<GlobalName>);

export const NonJsonGlobal = Schema.Literals([
  ...(['NaN', 'Infinity'] satisfies ReadonlyArray<GlobalName>),
  // `undefined` is a primitive, not a property of `globalThis` in the TypeScript lib.
  'undefined',
]);

export const EndpointMethod = Schema.Literals([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
] satisfies ReadonlyArray<keyof typeof HttpApiEndpoint>);

export const CookieHeader = Schema.Literals(['cookie', 'set-cookie']);

/**
 * Text that starts an SSE field line (`data:`, `event:`, `id:` or `retry:`) and ends with the blank line that
 * dispatches the event. A comment frame such as `: ping\n\n` has no field, and `Sse.encoder` cannot write it.
 */
export const SseFrame = Schema.String.check(Schema.isPattern(/(?:^|[\n\r])(?:data|event|id|retry):.*(?:\r?\n){2}$/su));

/**
 * Field prefixes a hand-written parser tests lines against. `data:` without a space is left out because it also starts
 * data URLs.
 */
export const SseFieldPrefix = Schema.Literals(['data: ', 'event: ', 'id: ', 'retry: ']);

export const Encoding = Schema.Literals(['base64', 'base64url', 'hex']);

export type Encoding = typeof Encoding.Type;

export const JwtSegmentName = Schema.Literals(['header', 'payload', 'signature']);

export const NodeIpCheck = Schema.Literals(['isIP', 'isIPv4', 'isIPv6']);

/**
 * Special-purpose addresses that code compares against as text.
 */
export const SpecialIpLiteral = Schema.Literals(['0.0.0.0', '127.0.0.1', '255.255.255.255', '::', '::1']);

/**
 * Environment variables that `UserDirectories` reads through the `ConfigProvider`.
 */
export const DirectoryVariable = Schema.Literals([
  'APPDATA',
  'HOME',
  'LOCALAPPDATA',
  'USERPROFILE',
  'XDG_CACHE_HOME',
  'XDG_CONFIG_HOME',
  'XDG_DATA_HOME',
  'XDG_STATE_HOME',
]);

export const ComponentWrapperName = Schema.Literals(['forwardRef', 'memo']);

// Anything that reads like `use client`, `use server` or `use cache`, in any case or spacing.
export const DirectiveLike = Schema.String.check(Schema.isPattern(/^\s*use[\s_-]*(?:client|server|cache)\b/iu));

export const ExactDirective = Schema.String.check(Schema.isPattern(/^use (?:client|server|cache(?:: [\w-]+)?)$/u));

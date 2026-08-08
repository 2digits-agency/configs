import type { TwoDigitsConfig } from './config';

/**
 * Effect rules provided by the `effecttsgo` plugin from `@effect/tsgo`.
 *
 * The plugin is compiled into Oxlint by a binary patch, so this config only works in projects that installed
 * `@effect/tsgo` and ran `effect-tsgo patch --oxlint`. Without the patch Oxlint rejects the whole configuration with
 * `Unknown plugin: 'effecttsgo'`, which is why these rules ship from a dedicated entrypoint instead of the default
 * preset.
 *
 * Every rule needs type-aware linting, hence `options.typeAware`.
 *
 * @example
 *   ```ts
 *   // oxlint.config.ts
 *   import { withTwoDigits } from '@2digits/oxlint-config';
 *   import { effectConfig } from '@2digits/oxlint-config/effect';
 *
 *   export default withTwoDigits(effectConfig);
 *   ```;
 *
 * @see https://github.com/Effect-TS/tsgo/blob/main/docs/README.md
 */
export const effectConfig: TwoDigitsConfig = {
  plugins: ['effecttsgo'],
  options: {
    typeAware: true,
  },
  rules: {
    'effecttsgo/abort-controller-in-effect': 'error',
    'effecttsgo/any-unknown-in-error-context': 'error',
    'effecttsgo/async-function': 'error',
    'effecttsgo/catch-all-to-map-error': 'error',
    'effecttsgo/catch-chain-to-first-success-of': 'error',
    'effecttsgo/catch-tag-to-catch-reason': 'error',
    'effecttsgo/catch-to-ignore': 'error',
    'effecttsgo/catch-to-or-else-succeed': 'error',
    'effecttsgo/catch-unfailable-effect': 'error',
    'effecttsgo/crypto-random-uuid': 'error',
    'effecttsgo/crypto-random-uuid-in-effect': 'error',
    'effecttsgo/deterministic-keys': 'error',
    'effecttsgo/duplicate-package': 'error',
    'effecttsgo/effect-do-notation': 'error',
    'effecttsgo/effect-fn-iife': 'error',
    'effecttsgo/effect-fn-opportunity': 'error',
    'effecttsgo/effect-gen-uses-adapter': 'error',
    'effecttsgo/effect-in-failure': 'error',
    'effecttsgo/effect-in-void-success': 'error',
    'effecttsgo/effect-map-flatten': 'error',
    'effecttsgo/effect-map-void': 'error',
    'effecttsgo/effect-succeed-with-void': 'error',
    'effecttsgo/extends-native-error': 'error',
    'effecttsgo/flat-map-to-map': 'error',
    'effecttsgo/generic-effect-services': 'error',
    'effecttsgo/global-console': 'error',
    'effecttsgo/global-console-in-effect': 'error',
    'effecttsgo/global-date': 'error',
    'effecttsgo/global-date-in-effect': 'error',
    'effecttsgo/global-error-in-effect-catch': 'error',
    'effecttsgo/global-error-in-effect-failure': 'error',
    'effecttsgo/global-fetch': 'error',
    'effecttsgo/global-fetch-in-effect': 'error',
    'effecttsgo/global-random': 'error',
    'effecttsgo/global-random-in-effect': 'error',
    'effecttsgo/global-timers': 'error',
    'effecttsgo/global-timers-in-effect': 'error',
    'effecttsgo/instance-of-schema': 'error',
    'effecttsgo/layer-merge-all-with-dependencies': 'error',
    'effecttsgo/lazy-effect': 'error',
    'effecttsgo/lazy-promise-in-effect-sync': 'error',
    'effecttsgo/leaking-requirements': 'error',
    'effecttsgo/missed-pipeable-opportunity': 'error',
    'effecttsgo/missing-effect-service-dependency': 'error',
    'effecttsgo/missing-pipeable-signature': 'warn',
    'effecttsgo/multiple-catch-tag': 'error',
    'effecttsgo/multiple-effect-provide': 'error',
    'effecttsgo/nested-effect-gen-yield': 'error',
    'effecttsgo/new-promise': 'error',
    'effecttsgo/new-schema-class': 'error',
    'effecttsgo/node-builtin-import': 'error',
    'effecttsgo/outdated-api': 'error',
    'effecttsgo/prefer-schema-over-json': 'error',
    'effecttsgo/prefer-schema-type-property': 'error',
    'effecttsgo/prefer-typed-schema-decoder': 'error',
    'effecttsgo/prefer-unsafe-constructor': 'error',
    'effecttsgo/process-env': 'error',
    'effecttsgo/process-env-in-effect': 'error',
    'effecttsgo/promise-in-effect-success': 'error',
    'effecttsgo/redundant-map-error': 'error',
    'effecttsgo/redundant-or-die': 'error',
    'effecttsgo/redundant-schema-tag-identifier': 'error',
    'effecttsgo/return-effect-in-gen': 'error',
    'effecttsgo/run-effect-inside-effect': 'error',
    'effecttsgo/schema-number': 'error',
    'effecttsgo/schema-struct-with-tag': 'error',
    'effecttsgo/schema-sync-in-effect': 'error',
    'effecttsgo/schema-union-of-literals': 'error',
    'effecttsgo/scope-in-layer-effect': 'error',
    'effecttsgo/service-not-as-class': 'error',
    'effecttsgo/strict-boolean-expressions': 'warn',
    'effecttsgo/strict-effect-provide': 'warn',
    'effecttsgo/sync-to-succeed': 'error',
    'effecttsgo/try-catch-in-effect-gen': 'error',
    'effecttsgo/unknown-in-effect-catch': 'error',
    'effecttsgo/unnecessary-arrow-block': 'error',
    'effecttsgo/unnecessary-effect-gen': 'error',
    'effecttsgo/unnecessary-fail-yieldable-error': 'error',
    'effecttsgo/unnecessary-pipe': 'error',
    'effecttsgo/unnecessary-pipe-chain': 'error',
    'effecttsgo/unnecessary-typeof-type': 'error',
    'effecttsgo/unsafe-effect-type-assertion': 'error',
  },
};

/**
 * {@link effectConfig}, targeted at the sources that are written with Effect.
 *
 * The rules judge plain TypeScript as well — `async-function`, `process-env` and `node-builtin-import` fire on any file
 * — so pointing them at a package that does not depend on `effect` reports advice that cannot be followed without
 * adopting Effect there. In a repository that mixes Effect and non-Effect packages, name the Effect ones. The plugin
 * itself stays enabled globally because Oxlint only accepts `plugins` and `options` at the top level.
 *
 * @example
 *   ```ts
 *   export default withTwoDigits(effectConfigFor(['packages/api/src/**', 'packages/worker/src/**']));
 *   ```;
 *
 * @param files Globs selecting the Effect sources.
 */
export function effectConfigFor(files: Array<string>): TwoDigitsConfig {
  return {
    plugins: effectConfig.plugins,
    options: effectConfig.options,
    overrides: [{ files, rules: effectConfig.rules }],
  };
}

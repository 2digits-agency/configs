import { alchemyNoCloudflareInitFinalizer } from './alchemy/alchemy-no-cloudflare-init-finalizer';
import { alchemyNoDeprecatedDockerConstraints } from './alchemy/alchemy-no-deprecated-docker-constraints';
import { alchemyNoDeprecatedResource } from './alchemy/alchemy-no-deprecated-resource';
import { alchemyNoPlaintextGithubSecret } from './alchemy/alchemy-no-plaintext-github-secret';
import { alchemyNoRemovedConfigApi } from './alchemy/alchemy-no-removed-config-api';
import { alchemyNoReservedEventbridgeDefaultName } from './alchemy/alchemy-no-reserved-eventbridge-default-name';
import { alchemyNoRuntimeConfig } from './alchemy/alchemy-no-runtime-config';
import { alchemyNoV1Import } from './alchemy/alchemy-no-v1-import';
import { alchemyNoV1WorkerProperties } from './alchemy/alchemy-no-v1-worker-properties';
import { avoidDataTaggedError } from './effect/avoid-data-tagged-error';
import { banErrorString } from './effect/ban-error-string';
import { corsCredentialsWithWildcard } from './effect/cors-credentials-with-wildcard';
import { dualNumericArityWithOptionalParameter } from './effect/dual-numeric-arity-with-optional-parameter';
import { effectPromiseVsTryPromise } from './effect/effect-promise-vs-trypromise';
import { noAlreadyStartedPromise } from './effect/no-already-started-promise';
import { noAsyncEffectTry } from './effect/no-async-effect-try';
import { noDiscardedRunPromise } from './effect/no-discarded-run-promise';
import { noDiscardedSchemaChecks } from './effect/no-discarded-schema-checks';
import { noEmptyEffectCallback } from './effect/no-empty-effect-callback';
import { noEmptySchemaStruct } from './effect/no-empty-schema-struct';
import { noFunctionConfigDefault } from './effect/no-function-config-default';
import { noHashAsIdentity } from './effect/no-hash-as-identity';
import { noLoggingInCatch } from './effect/no-logging-in-catch';
import { noMultiShotEffectCallback } from './effect/no-multi-shot-effect-callback';
import { noNonJsonSchemaAnnotation } from './effect/no-non-json-schema-annotation';
import { noOptionOfService } from './effect/no-option-of-service';
import { noOverwrittenDiscriminant } from './effect/no-overwritten-discriminant';
import { noServiceOptionGetOrThrow } from './effect/no-service-option-get-or-throw';
import { noThrowInEffectCallback } from './effect/no-throw-in-effect-callback';
import { noZeroRetryTimes } from './effect/no-zero-retry-times';
import { preferUninterruptible } from './effect/prefer-uninterruptible';
import { preferWithSpan } from './effect/prefer-with-span';
import { preferYieldNow } from './effect/prefer-yield-now';
import { preserveCaughtError } from './effect/preserve-caught-error';
import { requireSchemaClassBrand } from './effect/require-schema-class-brand';
import { throwInEffectGen } from './effect/throw-in-effect-gen';

export const rules = {
  'alchemy-no-cloudflare-init-finalizer': alchemyNoCloudflareInitFinalizer,
  'alchemy-no-deprecated-docker-constraints': alchemyNoDeprecatedDockerConstraints,
  'alchemy-no-deprecated-resource': alchemyNoDeprecatedResource,
  'alchemy-no-plaintext-github-secret': alchemyNoPlaintextGithubSecret,
  'alchemy-no-removed-config-api': alchemyNoRemovedConfigApi,
  'alchemy-no-reserved-eventbridge-default-name': alchemyNoReservedEventbridgeDefaultName,
  'alchemy-no-runtime-config': alchemyNoRuntimeConfig,
  'alchemy-no-v1-import': alchemyNoV1Import,
  'alchemy-no-v1-worker-properties': alchemyNoV1WorkerProperties,
  'avoid-data-tagged-error': avoidDataTaggedError,
  'ban-error-string': banErrorString,
  'cors-credentials-with-wildcard': corsCredentialsWithWildcard,
  'dual-numeric-arity-with-optional-parameter': dualNumericArityWithOptionalParameter,
  'effect-promise-vs-trypromise': effectPromiseVsTryPromise,
  'no-already-started-promise': noAlreadyStartedPromise,
  'no-async-effect-try': noAsyncEffectTry,
  'no-discarded-run-promise': noDiscardedRunPromise,
  'no-discarded-schema-checks': noDiscardedSchemaChecks,
  'no-empty-effect-callback': noEmptyEffectCallback,
  'no-empty-schema-struct': noEmptySchemaStruct,
  'no-function-config-default': noFunctionConfigDefault,
  'no-hash-as-identity': noHashAsIdentity,
  'no-logging-in-catch': noLoggingInCatch,
  'no-multi-shot-effect-callback': noMultiShotEffectCallback,
  'no-non-json-schema-annotation': noNonJsonSchemaAnnotation,
  'no-option-of-service': noOptionOfService,
  'no-overwritten-discriminant': noOverwrittenDiscriminant,
  'no-service-option-get-or-throw': noServiceOptionGetOrThrow,
  'no-throw-in-effect-callback': noThrowInEffectCallback,
  'no-zero-retry-times': noZeroRetryTimes,
  'prefer-uninterruptible': preferUninterruptible,
  'prefer-with-span': preferWithSpan,
  'prefer-yield-now': preferYieldNow,
  'preserve-caught-error': preserveCaughtError,
  'require-schema-class-brand': requireSchemaClassBrand,
  'throw-in-effect-gen': throwInEffectGen,
} as const;

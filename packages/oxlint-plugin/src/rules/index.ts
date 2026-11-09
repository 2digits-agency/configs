import { alchemyDomainBlockFileName } from './alchemy/alchemy-domain-block-file-name';
import { alchemyDomainPureDecide } from './alchemy/alchemy-domain-pure-decide';
import { alchemyDomainPureImports } from './alchemy/alchemy-domain-pure-imports';
import { alchemyDomainRequireViewVersion } from './alchemy/alchemy-domain-require-view-version';
import { alchemyDomainTotalHandlers } from './alchemy/alchemy-domain-total-handlers';
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
import { consistentSchemaPipe } from './effect/consistent-schema-pipe';
import { corsCredentialsWithWildcard } from './effect/cors-credentials-with-wildcard';
import { dualNumericArityWithOptionalParameter } from './effect/dual-numeric-arity-with-optional-parameter';
import { effectPromiseVsTryPromise } from './effect/effect-promise-vs-trypromise';
import { noAlreadyStartedPromise } from './effect/no-already-started-promise';
import { noAsyncEffectTry } from './effect/no-async-effect-try';
import { noDiscardedRunPromise } from './effect/no-discarded-run-promise';
import { noDiscardedSchemaChecks } from './effect/no-discarded-schema-checks';
import { noEffectAlchemyBarrelImports } from './effect/no-effect-alchemy-barrel-imports';
import { noEffectAsOnLog } from './effect/no-effect-as-on-log';
import { noEmptyEffectCallback } from './effect/no-empty-effect-callback';
import { noEmptySchemaStruct } from './effect/no-empty-schema-struct';
import { noEncodingGetOrThrow } from './effect/no-encoding-get-or-throw';
import { noFunctionConfigDefault } from './effect/no-function-config-default';
import { noHashAsIdentity } from './effect/no-hash-as-identity';
import { noInlineSchemaCompile } from './effect/no-inline-schema-compile';
import { noLoggingInCatch } from './effect/no-logging-in-catch';
import { noManualEffectErrorTag } from './effect/no-manual-effect-error-tag';
import { noManualEncoding } from './effect/no-manual-encoding';
import { noManualSse } from './effect/no-manual-sse';
import { noManualTagComparison } from './effect/no-manual-tag-comparison';
import { noManualTaggedConstruction } from './effect/no-manual-tagged-construction';
import { noMillisArithmetic } from './effect/no-millis-arithmetic';
import { noMultiShotEffectCallback } from './effect/no-multi-shot-effect-callback';
import { noNonJsonSchemaAnnotation } from './effect/no-non-json-schema-annotation';
import { noOptionOfService } from './effect/no-option-of-service';
import { noOverwrittenDiscriminant } from './effect/no-overwritten-discriminant';
import { noServiceConstructorImports } from './effect/no-service-constructor-imports';
import { noServiceOptionGetOrThrow } from './effect/no-service-option-get-or-throw';
import { noThrowInEffectCallback } from './effect/no-throw-in-effect-callback';
import { noUppercaseHttpApiHeader } from './effect/no-uppercase-http-api-header';
import { noZeroRetryTimes } from './effect/no-zero-retry-times';
import { preferDataMatch } from './effect/prefer-data-match';
import { preferEffectAlchemyNamespaceImports } from './effect/prefer-effect-alchemy-namespace-imports';
import { preferEffectArchive } from './effect/prefer-effect-archive';
import { preferEffectArrayOps } from './effect/prefer-effect-array-ops';
import { preferEffectArraySort } from './effect/prefer-effect-array-sort';
import { preferEffectDateTime } from './effect/prefer-effect-datetime';
import { preferEffectDuration } from './effect/prefer-effect-duration';
import { preferEffectDurationConstants } from './effect/prefer-effect-duration-constants';
import { preferEffectDurationTypes } from './effect/prefer-effect-duration-types';
import { preferEffectEncoding } from './effect/prefer-effect-encoding';
import { preferEffectFileSystem } from './effect/prefer-effect-filesystem';
import { preferEffectFilter } from './effect/prefer-effect-filter';
import { preferEffectHeaders } from './effect/prefer-effect-headers';
import { preferEffectMatch } from './effect/prefer-effect-match';
import { preferEffectPath } from './effect/prefer-effect-path';
import { preferEffectPredicate } from './effect/prefer-effect-predicate';
import { preferEffectSse } from './effect/prefer-effect-sse';
import { preferEffectUrl } from './effect/prefer-effect-url';
import { preferEqual } from './effect/prefer-equal';
import { preferHoistedMatch } from './effect/prefer-hoisted-match';
import { preferStructAssign } from './effect/prefer-struct-assign';
import { preferUninterruptible } from './effect/prefer-uninterruptible';
import { preferWithSpan } from './effect/prefer-with-span';
import { preferYieldNow } from './effect/prefer-yield-now';
import { preserveCaughtError } from './effect/preserve-caught-error';
import { requireSchemaClassBrand } from './effect/require-schema-class-brand';
import { requireTryPromiseAbortSignal } from './effect/require-try-promise-abort-signal';
import { throwInEffectGen } from './effect/throw-in-effect-gen';
import { noConstantThunk } from './functions/no-constant-thunk';
import { noForwardingLambda } from './functions/no-forwarding-lambda';
import { noSingleUsePrivateFunction } from './functions/no-single-use-private-function';
import { noTrivialWrapper } from './functions/no-trivial-wrapper';
import { noUtcIsoSlicing } from './no-utc-iso-slicing';
import { paddingLineBetweenStatements } from './padding-line-between-statements';
import { noBrowserApiInRender } from './react/no-browser-api-in-render';
import { noExportAllInClient } from './react/no-export-all-in-client';
import { validDirective } from './react/valid-directive';

export const rules = {
  'alchemy-domain-block-file-name': alchemyDomainBlockFileName,
  'alchemy-domain-pure-decide': alchemyDomainPureDecide,
  'alchemy-domain-pure-imports': alchemyDomainPureImports,
  'alchemy-domain-require-view-version': alchemyDomainRequireViewVersion,
  'alchemy-domain-total-handlers': alchemyDomainTotalHandlers,
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
  'consistent-schema-pipe': consistentSchemaPipe,
  'cors-credentials-with-wildcard': corsCredentialsWithWildcard,
  'dual-numeric-arity-with-optional-parameter': dualNumericArityWithOptionalParameter,
  'effect-promise-vs-trypromise': effectPromiseVsTryPromise,
  'no-already-started-promise': noAlreadyStartedPromise,
  'no-async-effect-try': noAsyncEffectTry,
  'no-browser-api-in-render': noBrowserApiInRender,
  'no-constant-thunk': noConstantThunk,
  'no-discarded-run-promise': noDiscardedRunPromise,
  'no-discarded-schema-checks': noDiscardedSchemaChecks,
  'no-effect-as-on-log': noEffectAsOnLog,
  'no-empty-effect-callback': noEmptyEffectCallback,
  'no-empty-schema-struct': noEmptySchemaStruct,
  'no-encoding-get-or-throw': noEncodingGetOrThrow,
  'no-export-all-in-client': noExportAllInClient,
  'no-effect-alchemy-barrel-imports': noEffectAlchemyBarrelImports,
  'no-forwarding-lambda': noForwardingLambda,
  'no-function-config-default': noFunctionConfigDefault,
  'no-hash-as-identity': noHashAsIdentity,
  'no-inline-schema-compile': noInlineSchemaCompile,
  'no-logging-in-catch': noLoggingInCatch,
  'no-manual-effect-error-tag': noManualEffectErrorTag,
  'no-manual-encoding': noManualEncoding,
  'no-manual-sse': noManualSse,
  'no-manual-tag-comparison': noManualTagComparison,
  'no-manual-tagged-construction': noManualTaggedConstruction,
  'no-millis-arithmetic': noMillisArithmetic,
  'no-multi-shot-effect-callback': noMultiShotEffectCallback,
  'no-non-json-schema-annotation': noNonJsonSchemaAnnotation,
  'no-option-of-service': noOptionOfService,
  'no-overwritten-discriminant': noOverwrittenDiscriminant,
  'no-service-option-get-or-throw': noServiceOptionGetOrThrow,
  'no-single-use-private-function': noSingleUsePrivateFunction,
  'no-service-constructor-imports': noServiceConstructorImports,
  'no-throw-in-effect-callback': noThrowInEffectCallback,
  'no-trivial-wrapper': noTrivialWrapper,
  'no-uppercase-http-api-header': noUppercaseHttpApiHeader,
  'no-utc-iso-slicing': noUtcIsoSlicing,
  'no-zero-retry-times': noZeroRetryTimes,
  'padding-line-between-statements': paddingLineBetweenStatements,
  'prefer-data-match': preferDataMatch,
  'prefer-effect-alchemy-namespace-imports': preferEffectAlchemyNamespaceImports,
  'prefer-effect-archive': preferEffectArchive,
  'prefer-effect-array-ops': preferEffectArrayOps,
  'prefer-effect-array-sort': preferEffectArraySort,
  'prefer-effect-datetime': preferEffectDateTime,
  'prefer-effect-duration': preferEffectDuration,
  'prefer-effect-duration-constants': preferEffectDurationConstants,
  'prefer-effect-duration-types': preferEffectDurationTypes,
  'prefer-effect-encoding': preferEffectEncoding,
  'prefer-effect-filesystem': preferEffectFileSystem,
  'prefer-effect-filter': preferEffectFilter,
  'prefer-effect-headers': preferEffectHeaders,
  'prefer-effect-match': preferEffectMatch,
  'prefer-effect-path': preferEffectPath,
  'prefer-effect-predicate': preferEffectPredicate,
  'prefer-effect-sse': preferEffectSse,
  'prefer-effect-url': preferEffectUrl,
  'prefer-hoisted-match': preferHoistedMatch,
  'prefer-equal': preferEqual,
  'prefer-struct-assign': preferStructAssign,
  'prefer-uninterruptible': preferUninterruptible,
  'prefer-with-span': preferWithSpan,
  'prefer-yield-now': preferYieldNow,
  'preserve-caught-error': preserveCaughtError,
  'require-schema-class-brand': requireSchemaClassBrand,
  'require-try-promise-abort-signal': requireTryPromiseAbortSignal,
  'throw-in-effect-gen': throwInEffectGen,
  'valid-directive': validDirective,
} as const;

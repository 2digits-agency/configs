import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Redacted from 'effect/Redacted';
import type * as Schema from 'effect/Schema';
import type * as SchemaIssue from 'effect/SchemaIssue';
import * as SchemaParser from 'effect/SchemaParser';
import type * as HttpClientError from 'effect/unstable/http/HttpClientError';
import * as HttpClientRequest from 'effect/unstable/http/HttpClientRequest';

import { TloApiError, TloNetworkError, TloParseError, type TloError } from '../schemas/errors.js';
import { TloConfig } from './TloConfig.js';
import { TloHttpClient } from './TloHttpClient.js';

export interface TeamLeaderClientShape {
  readonly post: <TResponse, TEnv>(
    path: string,
    body: Record<string, string | number | boolean | undefined>,
    schema: Schema.ConstraintDecoder<TResponse, TEnv>,
  ) => Effect.Effect<TResponse, TloError, TEnv>;
}

export class TeamLeaderClient extends Context.Service<TeamLeaderClient, TeamLeaderClientShape>()(
  '@2digits/tlo-mcp/services/TeamLeaderClient',
) {}

function mapHttpError(path: string) {
  return (error: HttpClientError.HttpClientError): TloNetworkError =>
    new TloNetworkError({
      message:
        error.reason._tag === 'StatusCodeError'
          ? `HTTP ${error.reason.response.status}`
          : `Request failed: ${error.reason.message}`,
      cause: error,
      endpoint: path,
    });
}

function mapParseError(error: SchemaIssue.Issue): TloParseError {
  return new TloParseError({
    message: 'Failed to parse response',
    cause: error,
  });
}

function isErrorResponse(json: unknown): json is { MSG: string; err: number } {
  return typeof json === 'object' && json !== null && 'err' in json && typeof json.err === 'number' && json.err !== 0;
}

/**
 * TLO sometimes returns malformed "JSON" with single quotes: {MSG:'...', err:1} This regex detects and extracts the
 * error message from such responses.
 */
const MALFORMED_ERROR_REGEX = /\{MSG:'([^']*)',\s*err:(\d+)\}/;

function parseMalformedJson(text: string) {
  const match = MALFORMED_ERROR_REGEX.exec(text);

  if (match) {
    return Option.some({ MSG: match[1] ?? 'Unknown error', err: Number(match[2]) });
  }

  return Option.none();
}

export const TeamLeaderClientLive = Layer.effect(
  TeamLeaderClient,
  Effect.gen(function* () {
    const config = yield* TloConfig;
    const { client } = yield* TloHttpClient;

    return TeamLeaderClient.of({
      post: Effect.fn('TeamLeaderClient.post')(function* <TResponse, TEnv>(
        path: string,
        body: Record<string, string | number | boolean | undefined>,
        schema: Schema.ConstraintDecoder<TResponse, TEnv>,
      ) {
        const bodyWithToken = {
          ...body,
          t: Redacted.value(config.sessionToken),
        };

        return yield* HttpClientRequest.post(path).pipe(
          HttpClientRequest.bodyUrlParams(bodyWithToken),
          client.execute,
          Effect.flatMap((response) => response.text),
          Effect.flatMap((text): Effect.Effect<TResponse, TloParseError | TloApiError, TEnv> => {
            const malformedError = parseMalformedJson(text);

            if (Option.isSome(malformedError) && malformedError.value.err !== 0) {
              return Effect.fail(
                new TloApiError({
                  message: malformedError.value.MSG,
                  endpoint: path,
                }),
              );
            }

            let json: unknown;

            try {
              json = JSON.parse(text);
            } catch {
              return Effect.fail(
                new TloParseError({
                  message: 'Invalid JSON response',
                  cause: text,
                }),
              );
            }

            if (isErrorResponse(json)) {
              return Effect.fail(
                new TloApiError({
                  message: json.MSG,
                  endpoint: path,
                }),
              );
            }

            return SchemaParser.decodeUnknownEffect(schema)(json).pipe(Effect.mapError(mapParseError));
          }),
          Effect.scoped,
          Effect.mapError((error): TloError => {
            if (error instanceof TloApiError || error instanceof TloParseError) {
              return error;
            }

            return mapHttpError(path)(error);
          }),
        );
      }),
    });
  }),
);

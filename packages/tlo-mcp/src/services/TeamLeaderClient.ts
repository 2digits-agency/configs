import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Match from 'effect/Match';
import * as R from 'effect/Record';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import * as HttpBody from 'effect/http/HttpBody';
import * as UrlParams from 'effect/http/UrlParams';

import { TloApiError, TloAuthError, TloNetworkError, TloParseError, type TloError } from '../schemas/errors.js';
import { TloConfig } from './TloConfig.js';
import { TloHttpClient } from './TloHttpClient.js';

export interface TeamLeaderClientShape {
  readonly post: <TSchema extends Schema.Constraint>(
    path: string,
    body: Record<string, string | number | boolean | undefined>,
    schema: TSchema,
  ) => Effect.Effect<TSchema['Type'], TloError, TSchema['DecodingServices']>;
}

export class TeamLeaderClient extends Context.Service<TeamLeaderClient, TeamLeaderClientShape>()(
  '@2digits/tlo-mcp/services/TeamLeaderClient',
) {}

const TloApiErrorResponse = Schema.Struct({
  MSG: Schema.String,
  err: Schema.Finite,
});

const JsonFromString = Schema.fromJsonString(Schema.Unknown);

/**
 * TLO sometimes returns malformed "JSON" with single quotes: {MSG:'...', err:1} Only match a complete legacy envelope
 * after JSON decoding fails, never legacy-looking text embedded in a valid JSON response.
 */
const MALFORMED_ERROR_REGEX = /^\s*\{MSG:'([^']*)',\s*err:(\d+)\}\s*$/;

export const TeamLeaderClientLive = Layer.effect(
  TeamLeaderClient,
  Effect.gen(function* () {
    const config = yield* TloConfig;

    const { client } = yield* TloHttpClient;

    return TeamLeaderClient.of({
      post: Effect.fn('TeamLeaderClient.post')(
        function* <TSchema extends Schema.Constraint>(
          path: string,
          body: Record<string, string | number | boolean | undefined>,
          schema: TSchema,
        ) {
          const bodyWithToken = R.set(body, 't', Redacted.value(config.sessionToken));

          const urlParams = UrlParams.fromInput(bodyWithToken);

          const response = yield* client.post(path, { body: HttpBody.urlParams(urlParams) });

          const text = yield* response.text;

          const json = yield* Schema.decodeEffect(JsonFromString)(text).pipe(
            Effect.catchTag('SchemaError', (cause) =>
              Match.value(MALFORMED_ERROR_REGEX.exec(text)).pipe(
                Match.when(Match.defined, (groups) =>
                  Effect.succeed({ MSG: groups[1] ?? 'Unknown error', err: Number(groups[2]) }),
                ),
                Match.orElse(() => Effect.fail(cause)),
              ),
            ),
            Effect.mapError((cause) =>
              TloParseError.make({
                message: 'Invalid JSON response',
                cause,
              }),
            ),
          );

          yield* Match.value(json).pipe(
            Match.when(Schema.is(TloApiErrorResponse), (errorResponse) =>
              errorResponse.err === 0
                ? Effect.void
                : TloApiError.make({
                    message: errorResponse.MSG,
                    endpoint: path,
                  }),
            ),
            Match.orElse(() => Effect.void),
          );

          return yield* Schema.decodeUnknownEffect(schema)(json).pipe(
            Effect.mapError((cause) =>
              TloParseError.make({
                message: 'Failed to parse response',
                cause,
              }),
            ),
          );
        },
        Effect.scoped,
        (effect, path) =>
          effect.pipe(
            Effect.catchReason(
              'HttpClientError',
              'StatusCodeError',
              (reason, error): Effect.Effect<never, TloAuthError | TloNetworkError> =>
                reason.response.status === 401
                  ? TloAuthError.make({ message: 'HTTP 401' })
                  : TloNetworkError.make({
                      message: `HTTP ${reason.response.status}`,
                      cause: error,
                      endpoint: path,
                    }),
              (_reason, error) =>
                TloNetworkError.make({
                  message:
                    error.response === undefined ? `Request failed: ${error.message}` : `HTTP ${error.response.status}`,
                  cause: error,
                  endpoint: path,
                }),
            ),
          ),
      ),
    });
  }),
);

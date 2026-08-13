import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Match from 'effect/Match';
import * as Option from 'effect/Option';
import * as Record from 'effect/Record';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import * as HttpBody from 'effect/unstable/http/HttpBody';
import type * as HttpClientError from 'effect/unstable/http/HttpClientError';
import * as UrlParams from 'effect/unstable/http/UrlParams';

import { TloApiError, TloNetworkError, TloParseError, type TloError } from '../schemas/errors.js';
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
 * TLO sometimes returns malformed "JSON" with single quotes: {MSG:'...', err:1} This regex detects and extracts the
 * error message from such responses.
 */
const MALFORMED_ERROR_REGEX = /\{MSG:'([^']*)',\s*err:(\d+)\}/;

function parseMalformedJson(text: string): Option.Option<{ readonly MSG: string; readonly err: number }> {
  const match = MALFORMED_ERROR_REGEX.exec(text);

  return Match.value(match).pipe(
    Match.when(Match.defined, (groups) => Option.some({ MSG: groups[1] ?? 'Unknown error', err: Number(groups[2]) })),
    Match.orElse(() => Option.none()),
  );
}

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
          const bodyWithToken = Record.set(body, 't', Redacted.value(config.sessionToken));
          const urlParams = UrlParams.fromInput(bodyWithToken);
          const response = yield* client.post(path, { body: HttpBody.urlParams(urlParams) });
          const text = yield* response.text;
          const malformedError = parseMalformedJson(text);

          yield* Match.value(malformedError).pipe(
            Match.tag('Some', ({ value }) =>
              value.err === 0
                ? Effect.void
                : TloApiError.make({
                    message: value.MSG,
                    endpoint: path,
                  }),
            ),
            Match.tag('None', () => Effect.void),
            Match.exhaustive,
          );

          const json = yield* Schema.decodeEffect(JsonFromString)(text).pipe(
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
            Effect.mapError((error): TloError =>
              Match.value(error).pipe(
                Match.when(Schema.is(TloApiError), (error) => error),
                Match.when(Schema.is(TloParseError), (error) => error),
                Match.orElse((error: HttpClientError.HttpClientError) =>
                  TloNetworkError.make({
                    message:
                      error.response === undefined
                        ? `Request failed: ${error.message}`
                        : `HTTP ${error.response.status}`,
                    cause: error,
                    endpoint: path,
                  }),
                ),
              ),
            ),
          ),
      ),
    });
  }),
);

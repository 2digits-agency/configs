import * as Schema from 'effect/Schema';

/**
 * Error returned when the TLO API indicates failure.
 * This occurs when success: false in the response envelope.
 */
export class TloApiError extends Schema.TaggedError<TloApiError>()('TloApiError', {
  message: Schema.String,
  code: Schema.optional(Schema.String),
  endpoint: Schema.optional(Schema.String),
}) {}

/**
 * Error for authentication failures.
 * Session token expired or invalid credentials.
 */
export class TloAuthError extends Schema.TaggedError<TloAuthError>()('TloAuthError', {
  message: Schema.String,
}) {}

/**
 * Error for network/transport failures.
 * Connection refused, timeout, etc.
 */
export class TloNetworkError extends Schema.TaggedError<TloNetworkError>()('TloNetworkError', {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
  endpoint: Schema.optional(Schema.String),
}) {}

/**
 * Error when response parsing fails.
 * Unexpected response format from TLO.
 */
export class TloParseError extends Schema.TaggedError<TloParseError>()('TloParseError', {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

export type TloError = TloApiError | TloAuthError | TloNetworkError | TloParseError;

export const TloErrorSchema = Schema.Union(TloApiError, TloAuthError, TloNetworkError, TloParseError);

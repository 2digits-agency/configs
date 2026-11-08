import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';
import * as Struct from 'effect/Struct';
import type * as McpClientError from 'effect/ai/McpClientError';

/**
 * Why a composite could not complete. It is a plain class, not an Error, so McpServer encodes all fields into the tool
 * result and the MCP boundary can report rate limits (`status`, `retryAfter`) like forwarded tools.
 */
export class OrbitReadError extends Schema.Class<OrbitReadError, { readonly brand: unique symbol }>('OrbitReadError')({
  message: Schema.String,
  status: Schema.Int.annotate({ description: 'HTTP status of the failed Orbit call' }).pipe(Schema.optionalKey),
  retryAfter: Schema.String.pipe(Schema.optionalKey),
}) {}

const isOrbitReadError = Schema.is(OrbitReadError);

/**
 * Keep the upstream message and, for HTTP failures, the status and Retry-After.
 *
 * @param error
 */
export function toReadError(error: McpClientError.McpClientError | Schema.SchemaError | OrbitReadError) {
  if (isOrbitReadError(error)) {
    return error;
  }

  const http = P.isTagged(error, 'McpClientError') && P.isTagged(error.reason, 'HttpError') ? error.reason : undefined;

  return OrbitReadError.make({
    message: error.message,
    ...(P.isUndefined(http) ? {} : Struct.pick(http, ['status', 'retryAfter'])),
  });
}

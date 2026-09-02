import * as Schema from 'effect/Schema';

export class ApiError extends Schema.TaggedError<ApiError>()('ApiError', {
  message: Schema.String,
}) {}

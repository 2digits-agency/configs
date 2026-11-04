import * as Schema from 'effect/Schema';
import * as SchemaGetter from 'effect/SchemaGetter';

import { Line } from './text.js';

export class RunningTimer extends Schema.Class<RunningTimer, { readonly brand: unique symbol }>('RunningTimer')({
  running: Schema.Boolean,
  summary: Schema.String.annotate({ description: "Orbit's description of the running timer" }).pipe(Schema.optionalKey),
}) {}

/*
 * No fixture of a running timer exists yet, so its text is passed through as `summary`. Empty text and other "No …"
 * messages fail, so a changed idle message is not mistaken for a running timer.
 */
const Idle = Line(/^No timer is running\./, {}).pipe(
  Schema.decodeTo(RunningTimer, {
    decode: SchemaGetter.succeed({ running: false }),
    encode: SchemaGetter.forbiddenEncoding,
  }),
);

const Running = Line(/^(?!No )(?<summary>\S.*)$/s, { summary: Schema.Trim }).pipe(
  Schema.decodeTo(RunningTimer, {
    decode: SchemaGetter.transform(({ summary }) => ({ running: true, summary })),
    encode: SchemaGetter.forbiddenEncoding,
  }),
);

export const GetRunningTimer = {
  name: 'GetRunningTimer',
  // No arguments.
  args: Schema.Record(Schema.String, Schema.Never),
  result: Schema.Union([Idle, Running]),
};

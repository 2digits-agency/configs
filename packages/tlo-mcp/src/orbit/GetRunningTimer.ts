import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { orbitTool } from './text.js';

export class RunningTimer extends Schema.Class<RunningTimer, { readonly brand: unique symbol }>('RunningTimer')({
  running: Schema.Boolean,
  summary: Schema.String.annotate({ description: "Orbit's description of the running timer" }).pipe(Schema.optionalKey),
}) {}

/**
 * No fixture of a running timer exists yet, so its text is passed through as `summary` instead of parsed.
 *
 * @param text
 */
function parse(text: string) {
  return Result.succeed(
    Str.startsWith('No timer is running.')(text) ? { running: false } : { running: true, summary: Str.trim(text) },
  );
}

export const GetRunningTimer = orbitTool<Record<string, never>>()('GetRunningTimer', RunningTimer, parse);

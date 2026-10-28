import * as Schema from 'effect/Schema';

import { ApiId, Duration, LocalDate, Line, Lines, Timestamp } from './text.js';

/**
 * Orbit documents the kinds planned, fixed, request and refused, and prints fixed as `fixed-time`. Only `fixed-time`
 * and `planned` have been seen live.
 */
export const PlanningKind = Schema.Literals(['planned', 'fixed-time', 'request', 'refused']);

// `s`: free text can contain a bare LF inside Orbit's CRLF-delimited lines.
export const PlannedEntry = Line(
  /^- (?<start>\d{4}-\d{2}-\d{2} \d{2}:\d{2}) \| .+? \| (?<minutes>\d+h\d*) \| (?<kind>[a-z-]+) \| (?<work>.+?)(?: \| series (?<seriesId>[A-Z0-9]{15}))? {2}\(api_id: (?<id>[A-Z0-9]{15})\)$/s,
  {
    id: ApiId,
    start: Timestamp,
    minutes: Duration,
    kind: PlanningKind,
    work: Schema.String,
    seriesId: ApiId.pipe(Schema.optionalKey),
  },
);

export type PlannedEntry = typeof PlannedEntry.Type;

export const ListPlannedEntries = {
  name: 'ListPlannedEntries',
  args: Schema.Struct({ dateFrom: LocalDate, dateTo: LocalDate }),
  result: Lines(PlannedEntry, /^\d+ planning entries:$/, /^No planning entries match these filters\.$/),
};

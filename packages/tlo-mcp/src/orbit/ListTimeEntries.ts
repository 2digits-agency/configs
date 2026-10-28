import * as Schema from 'effect/Schema';
import * as SchemaGetter from 'effect/SchemaGetter';

import { EntryFields, TimeEntry, timeEntry } from './GetTimesheetWeek.js';
import { LocalDate, Line, Lines } from './text.js';

// `s`: descriptions can contain a bare LF inside Orbit's CRLF-delimited lines.
const Entry = Line(
  /^- (?<start>\d{4}-\d{2}-\d{2} \d{2}:\d{2}) \| .+? \| (?<minutes>\d+h\d*)(?: (?<planned>\[PLANNED\]))? \| (?:(?<absence>ABSENCE(?: \(pending approval\))?) )?(?![[(]|ABSENCE)(?<work>ticket ".*?"(?= — \d+ )|.+?)(?: — (?<description>.+?))? {2}\(api_id: (?<id>[A-Z0-9]{15})\)(?: \[locked: (?<lock>.+)\])?$/s,
  { start: Schema.String, ...EntryFields },
).pipe(
  Schema.decodeTo(TimeEntry, {
    decode: SchemaGetter.transform(({ start, ...entry }) => timeEntry(start, entry)),
    encode: SchemaGetter.forbiddenEncoding,
  }),
);

const TimeEntryList = Schema.Struct({
  entries: Lines(Entry, /^\d+ time entries/, /^Total duration: /, /^No time entries match these filters\.$/),
  truncated: Schema.Boolean.annotate({ description: 'Orbit capped the list at 100 rows; narrow the range' }),
});

export const ListTimeEntries = {
  name: 'ListTimeEntries',
  args: Schema.Struct({ dateFrom: LocalDate, dateTo: LocalDate, text: Schema.String.pipe(Schema.optionalKey) }),
  result: Schema.String.pipe(
    Schema.decodeTo(TimeEntryList, {
      decode: SchemaGetter.transform((text) => ({
        entries: text,
        truncated: /^\d+ time entries \(more exist/.test(text),
      })),
      encode: SchemaGetter.forbiddenEncoding,
    }),
  ),
};

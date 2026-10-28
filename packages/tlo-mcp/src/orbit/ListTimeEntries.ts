import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';

import { entryFrom, TimeEntry } from './GetTimesheetWeek.js';
import { orbitTool, parseItems } from './text.js';

export class TimeEntryList extends Schema.Class<TimeEntryList, { readonly brand: unique symbol }>('TimeEntryList')({
  entries: Schema.Array(TimeEntry),
  truncated: Schema.Boolean.annotate({ description: 'Orbit capped the list at 100 rows; narrow the range' }),
}) {}

// `s`: descriptions can contain a bare LF inside Orbit's CRLF-delimited lines.
const ITEM =
  /^- (?<date>\d{4}-\d{2}-\d{2}) (?<time>\d{2}:\d{2}) \| .+? \| (?<duration>\d+h(?:\d{2})?)(?<planned> \[PLANNED\])? \| (?<absence>ABSENCE (?:\(pending approval\) )?)?(?<rest>.+?) {2}\(api_id: (?<id>[A-Z0-9]{15})\)(?: \[locked: (?<lock>.+)\])?$/s;

function parse(text: string) {
  return parseItems(text, {
    empty: /^No time entries match these filters\.$/,
    ignore: [/^\d+ time entries/, /^Total duration: /],
    item: ITEM,
    make: (groups) =>
      entryFrom(groups.date, groups, groups.absence ?? (groups.planned === undefined ? undefined : '[PLANNED] ')),
  }).pipe(Result.map((entries) => ({ entries, truncated: /^\d+ time entries \(more exist/.test(text) })));
}

export const ListTimeEntries = orbitTool<{
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly text?: string;
}>()('ListTimeEntries', TimeEntryList, parse);

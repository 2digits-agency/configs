import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { ApiId, definedKey, localTimestamp, Minutes, orbitTool, parseItems, parseMinutes, Timestamp } from './text.js';

export class PlannedEntry extends Schema.Class<PlannedEntry, { readonly brand: unique symbol }>('PlannedEntry')({
  id: ApiId,
  start: Timestamp,
  minutes: Minutes,
  kind: Schema.String.annotate({ description: 'Orbit planning kind, e.g. "fixed-time" or "planned"' }),
  work: Schema.String,
  seriesId: ApiId.pipe(Schema.optionalKey),
}) {}

// `s`: free text can contain a bare LF inside Orbit's CRLF-delimited lines.
const ITEM =
  /^- (?<date>\d{4}-\d{2}-\d{2}) (?<time>\d{2}:\d{2}) \| .+? \| (?<duration>\d+h(?:\d{2})?) \| (?<kind>[a-z-]+) \| (?<work>.+?)(?: \| series (?<series>[A-Z0-9]{15}))? {2}\(api_id: (?<id>[A-Z0-9]{15})\)$/s;

function parse(text: string) {
  return parseItems(text, {
    empty: /^No planning entries match these filters\.$/,
    ignore: [/^\d+ planning entries:$/],
    item: ITEM,
    make: (groups) =>
      Result.gen(function* () {
        return {
          id: groups.id ?? '',
          start: yield* localTimestamp(groups.date, groups.time),
          minutes: yield* parseMinutes(groups.duration),
          kind: groups.kind ?? '',
          work: Str.trim(groups.work ?? ''),
          ...definedKey('seriesId', groups.series),
        };
      }),
  });
}

export const ListPlannedEntries = orbitTool<{ readonly dateFrom: string; readonly dateTo: string }>()(
  'ListPlannedEntries',
  Schema.Array(PlannedEntry),
  parse,
);

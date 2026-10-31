import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { ApiId, definedKey, LocalDate, Minutes, orbitTool, parseItems, parseMinutes } from './text.js';

export class Absence extends Schema.Class<Absence, { readonly brand: unique symbol }>('Absence')({
  id: ApiId,
  date: LocalDate,
  type: Schema.String.annotate({ description: 'Absence type, e.g. "Holiday" or "Office Closed"' }),
  minutes: Minutes,
  state: Schema.Literals(['approved', 'pending', 'refused', 'revoked']),
  note: Schema.String.pipe(Schema.optionalKey),
}) {}

// `s`: free text can contain a bare LF inside Orbit's CRLF-delimited lines.
const ITEM =
  /^- (?<date>\d{4}-\d{2}-\d{2}) \| .+? \| (?<type>.+) (?<duration>\d+h(?:\d{2})?) \| (?<state>[A-Z]+)(?: approval)?(?: — (?<note>.+?))? {2}\(api_id: (?<id>[A-Z0-9]{15})\)$/s;

function parse(text: string) {
  return parseItems(text, {
    empty: /^No absences match these filters\.$/,
    ignore: [/^\d+ absence\(s\):$/, /^Approve\/refuse pending requests/],
    item: ITEM,
    make: (groups) =>
      Result.gen(function* () {
        return {
          id: groups.id ?? '',
          date: groups.date ?? '',
          type: groups.type ?? '',
          minutes: yield* parseMinutes(groups.duration),
          state: Str.toLowerCase(groups.state ?? ''),
          ...definedKey('note', groups.note),
        };
      }),
  });
}

export const ListAbsences = orbitTool<{ readonly dateFrom: string; readonly dateTo: string }>()(
  'ListAbsences',
  Schema.Array(Absence),
  parse,
);

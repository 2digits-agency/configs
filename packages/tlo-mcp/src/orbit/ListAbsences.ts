import * as Schema from 'effect/Schema';
import * as SchemaGetter from 'effect/SchemaGetter';
import * as Str from 'effect/String';

import { ApiId, Duration, LocalDate, Line, Lines, Minutes } from './text.js';

export class Absence extends Schema.Class<Absence, { readonly brand: unique symbol }>('Absence')({
  id: ApiId,
  date: LocalDate,
  type: Schema.String.annotate({ description: 'Absence type, e.g. "Holiday" or "Office Closed"' }),
  minutes: Minutes,
  state: Schema.Literals(['approved', 'pending', 'refused', 'revoked']),
  note: Schema.String.pipe(Schema.optionalKey),
}) {}

// `s`: free text can contain a bare LF inside Orbit's CRLF-delimited lines.
const AbsenceLine = Line(
  /^- (?<date>\S+) \| .+? \| (?<type>(?:(?! \| ).)+) (?<minutes>\d+h\d*) \| (?<state>[A-Z]+)(?: approval)?(?: — (?<note>.+?))? {2}\(api_id: (?<id>[A-Z0-9]{15})\)$/s,
  {
    ...Absence.fields,
    minutes: Duration,
    state: Schema.Literals(['APPROVED', 'PENDING', 'REFUSED', 'REVOKED']).pipe(
      Schema.decodeTo(Absence.fields.state, {
        decode: SchemaGetter.transform(Str.toLowerCase),
        encode: SchemaGetter.transform(Str.toUpperCase),
      }),
    ),
  },
).pipe(Schema.decodeTo(Absence));

export const ListAbsences = {
  name: 'ListAbsences',
  args: Schema.Struct({ dateFrom: LocalDate, dateTo: LocalDate }),
  result: Lines(
    AbsenceLine,
    /^\d+ absence\(s\):$/,
    /^Approve\/refuse pending requests/,
    /^No absences match these filters\.$/,
  ),
};

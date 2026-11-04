import * as Schema from 'effect/Schema';

import { ApiId, Duration, Line, Lines, Minutes } from './text.js';

export class BookableTask extends Schema.Class<BookableTask, { readonly brand: unique symbol }>('BookableTask')({
  id: ApiId,
  label: Schema.String.annotate({ description: 'Project and task; Orbit separates both with " | ", as inside names' }),
  projectNumber: Schema.String.pipe(Schema.optionalKey),
  remainingMinutes: Minutes.annotate({ description: 'Remaining budget; absent when unlimited' }).pipe(
    Schema.optionalKey,
  ),
}) {}

const TaskRow = Line(
  /^\| (?<label>(?:(?<projectNumber>\d+) )?.+?) \| (?:unlimited|(?<remainingMinutes>\d+h\d*)) \| (?<id>[A-Z0-9]{15}) \|$/,
  { ...BookableTask.fields, remainingMinutes: Duration.pipe(Schema.optionalKey) },
).pipe(Schema.decodeTo(BookableTask));

export const ListMyTasks = {
  name: 'ListMyTasks',
  // No arguments.
  args: Schema.Record(Schema.String, Schema.Never),
  result: Lines(TaskRow, /^\d+ assignable task\(s\):$/, /^\| Project \|/, /^\|---/, /^No assignable tasks found/),
};

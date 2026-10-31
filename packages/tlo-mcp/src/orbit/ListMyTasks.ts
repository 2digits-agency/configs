import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { ApiId, definedKey, Minutes, orbitTool, parseItems, parseMinutes } from './text.js';

export class BookableTask extends Schema.Class<BookableTask, { readonly brand: unique symbol }>('BookableTask')({
  id: ApiId,
  label: Schema.String.annotate({ description: 'Project and task; Orbit separates both with " | ", as inside names' }),
  projectNumber: Schema.String.pipe(Schema.optionalKey),
  remainingMinutes: Minutes.annotate({ description: 'Remaining budget; absent when unlimited' }).pipe(
    Schema.optionalKey,
  ),
}) {}

const ITEM = /^\| (?<label>.+?) \| (?<remaining>unlimited|\d+h(?:\d{2})?) \| (?<id>[A-Z0-9]{15}) \|$/;

function parse(text: string) {
  return parseItems(text, {
    empty: /^No assignable tasks found/,
    ignore: [/^\d+ assignable task\(s\):$/, /^\| Project \|/, /^\|---/],
    item: ITEM,
    make: (groups) =>
      Result.gen(function* () {
        const label = Str.trim(groups.label ?? '');

        return {
          id: groups.id ?? '',
          label,
          ...definedKey('projectNumber', /^(\d+) /.exec(label)?.[1]),
          ...(groups.remaining === 'unlimited' ? {} : { remainingMinutes: yield* parseMinutes(groups.remaining) }),
        };
      }),
  });
}

export const ListMyTasks = orbitTool<Record<string, never>>()('ListMyTasks', Schema.Array(BookableTask), parse);

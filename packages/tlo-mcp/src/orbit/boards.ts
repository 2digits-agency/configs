import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { ApiId, atLine, definedKey, isSkipped, LocalDate, linesOf, matchLine, orbitTool, parseItems } from './text.js';

export class Board extends Schema.Class<Board, { readonly brand: unique symbol }>('Board')({
  id: ApiId,
  name: Schema.String,
  listCount: Schema.Int,
  cardCount: Schema.Int,
  ownerId: ApiId,
}) {}

export class BoardList extends Schema.Class<BoardList, { readonly brand: unique symbol }>('BoardList')({
  id: ApiId,
  name: Schema.String,
  cardCount: Schema.Int,
  done: Schema.Boolean.annotate({ description: 'Final column: cards here count as done' }),
}) {}

export const CardFields = {
  id: ApiId,
  name: Schema.String,
  boardId: ApiId,
  listId: ApiId,
  list: Schema.String,
  done: Schema.Boolean,
  due: LocalDate.pipe(Schema.optionalKey),
  ownerId: ApiId.pipe(Schema.optionalKey),
};

export class Card extends Schema.Class<Card, { readonly brand: unique symbol }>('Card')(CardFields) {}

export class CardDetail extends Schema.Class<CardDetail, { readonly brand: unique symbol }>('CardDetail')({
  ...CardFields,
  description: Schema.String.pipe(Schema.optionalKey),
  checklist: Schema.String.annotate({ description: 'Checklist progress and counts as Orbit shows them' }).pipe(
    Schema.optionalKey,
  ),
  labels: Schema.Array(
    Schema.Struct({
      id: ApiId,
      name: Schema.String,
    }),
  ),
  linked: Schema.Array(
    Schema.Struct({
      type: Schema.String,
      id: ApiId,
      summary: Schema.String,
    }),
  ),
}) {}

const BOARD =
  /^- (?<id>[A-Z0-9]{15}) \| (?<name>.+) \| lists (?<lists>\d+), cards (?<cards>\d+) \| owner (?<owner>[A-Z0-9]{15})$/;

const LIST = /^- (?<id>[A-Z0-9]{15}) \| (?<name>.+?) \| cards (?<cards>\d+)(?<done> \| FINAL\/done)?$/;

const CARD =
  /^- (?<id>[A-Z0-9]{15}) \| (?<name>.+?) \| .+ \((?<boardId>[A-Z0-9]{15})\) \/ (?<list>.+?) \((?<listId>[A-Z0-9]{15})\)(?<done> \(done\))?(?: \| due (?<due>\d{4}-\d{2}-\d{2}))?(?: \| (?:owner (?<owner>[A-Z0-9]{15})|unassigned))?$/;

const DETAIL_HEADER = /^Card (?<id>[A-Z0-9]{15}) — (?<name>.+)$/;

const DETAIL_BOARD =
  /^Board\/list: .+ \((?<boardId>[A-Z0-9]{15})\) \/ (?<list>.+?) \((?<listId>[A-Z0-9]{15})\)(?<done> \(done\))?$/;

const DETAIL_OWNER = /^Owner: (?<owner>\S+)(?: \| due (?<due>\d{4}-\d{2}-\d{2}))?$/;

const FIELD = /^(?<key>Description|Owner|Checklist|Label): (?<value>.*)$/s;

const LABEL = /^Label: (?<name>.+) \((?<id>[A-Z0-9]{15})\)$/;

const LINKED = /^- (?<type>[A-Z_]+) (?<id>[A-Z0-9]{15}) \| (?<summary>.+)$/;

const API_ID = /^[A-Z0-9]{15}$/;

function cardFrom(groups: Readonly<Record<string, string | undefined>>) {
  return {
    id: groups.id ?? '',
    name: Str.trim(groups.name ?? ''),
    boardId: groups.boardId ?? '',
    listId: groups.listId ?? '',
    list: groups.list ?? '',
    done: groups.done !== undefined,
    ...definedKey('due', groups.due),
    ...(groups.owner !== undefined && API_ID.test(groups.owner) ? { ownerId: groups.owner } : {}),
  };
}

export const ListBoards = orbitTool<{ readonly search?: string; readonly limit: number }>()(
  'ListBoards',
  Schema.Array(Board),
  (text) =>
    parseItems(text, {
      empty: /^No boards found\.$/,
      ignore: [/^\d+ board\(s\):$/],
      item: BOARD,
      make: (groups) =>
        Result.succeed({
          id: groups.id ?? '',
          name: Str.trim(groups.name ?? ''),
          listCount: Number(groups.lists),
          cardCount: Number(groups.cards),
          ownerId: groups.owner ?? '',
        }),
    }),
);

export const ListBoardLists = orbitTool<{ readonly boardId: string }>()(
  'ListBoardLists',
  Schema.Array(BoardList),
  (text) =>
    parseItems(text, {
      item: LIST,
      make: (groups) =>
        Result.succeed({
          id: groups.id ?? '',
          name: Str.trim(groups.name ?? ''),
          cardCount: Number(groups.cards),
          done: groups.done !== undefined,
        }),
    }),
);

export const ListTodos = orbitTool<{ readonly boardId: string; readonly state: string; readonly limit: number }>()(
  'ListTodos',
  Schema.Array(Card),
  (text) =>
    parseItems(text, {
      empty: /^No cards match\.$/,
      ignore: [/^\d+ card\(s\):$/],
      item: CARD,
      make: (groups) => Result.succeed(cardFrom(groups)),
    }),
);

export const GetTodoDetail = orbitTool<{ readonly todoId: string }>()('GetTodoDetail', CardDetail, (text) =>
  Result.gen(function* () {
    const [header, board = '', ...lines] = linesOf(text);

    const fields: { ownerId?: string; due?: string; description?: string; checklist?: string } = {};

    const labels: Array<unknown> = [];

    const linked: Array<unknown> = [];

    for (const [index, line] of lines.entries()) {
      const field = FIELD.exec(line)?.groups;

      if (isSkipped(line, [/^Linked:$/])) {
        continue;
      }

      if (field?.key === 'Owner') {
        const { owner = '', due } = yield* atLine(index + 2, matchLine(DETAIL_OWNER, line));

        Object.assign(fields, API_ID.test(owner) ? { ownerId: owner } : {}, definedKey('due', due));

        continue;
      }

      if (field?.key === 'Label') {
        const { id, name = '' } = yield* atLine(index + 2, matchLine(LABEL, line));

        labels.push({ id, name: Str.trim(name) });

        continue;
      }

      if (field?.key === 'Description' || field?.key === 'Checklist') {
        Object.assign(fields, { [Str.toLowerCase(field.key)]: field.value });

        continue;
      }

      const { type, id, summary = '' } = yield* atLine(index + 2, matchLine(LINKED, line));

      linked.push({ type, id, summary: Str.trim(summary) });
    }

    return {
      ...cardFrom({
        ...(yield* atLine(0, matchLine(DETAIL_HEADER, header))),
        ...(yield* atLine(1, matchLine(DETAIL_BOARD, board))),
      }),
      ...fields,
      labels,
      linked,
    };
  }),
);

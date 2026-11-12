import * as Arr from 'effect/Array';
import * as Fn from 'effect/Function';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';
import * as Schema from 'effect/Schema';
import * as SchemaGetter from 'effect/SchemaGetter';
import * as Str from 'effect/String';
import * as Struct from 'effect/Struct';

import { ApiId, LocalDate, Line, Lines } from './text.js';

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
  boardId: ApiId,
  listId: ApiId,
  list: Schema.String,
  done: Schema.Boolean,
  due: LocalDate.pipe(Schema.optionalKey),
  ownerId: ApiId.pipe(Schema.optionalKey),
  priority: Schema.String.annotate({ description: 'As Orbit shows it, e.g. "high" or "medium"' }).pipe(
    Schema.optionalKey,
  ),
};

export class Card extends Schema.Class<Card, { readonly brand: unique symbol }>('Card')(
  Struct.assign(CardFields, {
    heading: Schema.String.annotate({
      description:
        'Card name and board name as ListTodos shows them, "<card> | <board>". Both can contain " | ", so only the caller that knows the board name can split them.',
    }),
  }),
) {}

export class CardDetail extends Schema.Class<CardDetail, { readonly brand: unique symbol }>('CardDetail')(
  Struct.assign(CardFields, {
    name: Schema.String,
    description: Schema.String.pipe(Schema.optionalKey),
    checklist: Schema.String.annotate({ description: 'Checklist progress and counts as Orbit shows them' }).pipe(
      Schema.optionalKey,
    ),
    labels: Schema.Array(Schema.Struct({ id: ApiId, name: Schema.String })),
    linked: Schema.Array(Schema.Struct({ type: Schema.String, id: ApiId, summary: Schema.String })),
  }),
) {}

const Count = Schema.FiniteFromString.check(Schema.isInt());

// A marker such as ` (done)` that Orbit prints only when it applies.
const Flag = Schema.String.pipe(
  Schema.optionalKey,
  Schema.decodeTo(Schema.Boolean, {
    decode: SchemaGetter.transformOptional(Fn.flow(Opt.isSome, Opt.some)),
    encode: SchemaGetter.forbiddenEncoding,
  }),
);

const BoardLine = Line(
  /^- (?<id>[A-Z0-9]{15}) \| (?<name>.+) \| lists (?<listCount>\d+), cards (?<cardCount>\d+) \| owner (?<ownerId>[A-Z0-9]{15})$/,
  { ...Board.fields, listCount: Count, cardCount: Count },
).pipe(Schema.decodeTo(Board));

const ListLine = Line(/^- (?<id>[A-Z0-9]{15}) \| (?<name>.+?) \| cards (?<cardCount>\d+)(?<done> \| FINAL\/done)?$/, {
  ...BoardList.fields,
  cardCount: Count,
  done: Flag,
}).pipe(Schema.decodeTo(BoardList));

const CardLine = Line(
  /^- (?<id>[A-Z0-9]{15}) \| (?<heading>.+) \((?<boardId>[A-Z0-9]{15})\) \/ (?<list>.+?) \((?<listId>[A-Z0-9]{15})\)(?<done> \(done\))?(?: \| due (?<due>\S+))?(?: \| prio (?<priority>[a-z]+))?(?: \| (?:owner (?<ownerId>[A-Z0-9]{15})|unassigned))?$/,
  { ...Card.fields, done: Flag },
).pipe(Schema.decodeTo(Card));

const FIELD = /^(?:Owner|Description|Checklist|Label): /;

const DetailText = Schema.Struct({
  header: Line(/^Card (?<id>[A-Z0-9]{15}) — (?<name>.+)$/, { id: ApiId, name: Schema.String }),
  board: Line(
    /^Board\/list: .+ \((?<boardId>[A-Z0-9]{15})\) \/ (?<list>.+?) \((?<listId>[A-Z0-9]{15})\)(?<done> \(done\))?$/,
    { boardId: ApiId, list: Schema.String, listId: ApiId, done: Flag },
  ),
  owner: Line(
    /^Owner: (?:(?<ownerId>[A-Z0-9]{15})|unassigned)(?: \| due (?<due>\S+))?(?: \| priority (?<priority>[a-z]+))?$/,
    { ownerId: CardFields.ownerId, due: CardFields.due, priority: CardFields.priority },
  ).pipe(Schema.optionalKey),
  // `s`: descriptions span several lines, separated by a bare LF.
  description: Line(/^Description: (?<text>.*)$/s, { text: Schema.String }).pipe(Schema.optionalKey),
  checklist: Line(/^Checklist: (?<text>.*)$/, { text: Schema.String }).pipe(Schema.optionalKey),
  labels: Schema.Array(Line(/^Label: (?<name>.+) \((?<id>[A-Z0-9]{15})\)$/, { id: ApiId, name: Schema.String })),
  linked: Schema.Array(
    Line(/^- (?<type>[A-Z_]+) (?<id>[A-Z0-9]{15}) \| (?<summary>.+)$/, {
      type: Schema.String,
      id: ApiId,
      summary: Schema.Trim,
    }),
  ),
});

/**
 * The first two lines are the card and its column; then single `Owner`, `Description` and `Checklist` lines, `Label`
 * lines and linked items. Every other line must be a linked item, so an unknown line fails as one.
 *
 * @param text
 */
function detailSections(text: string) {
  const [header = '', board = '', ...lines] = Arr.filter(
    Str.split(text, '\r\n'),
    (line) => Str.isNonEmpty(Str.trim(line)) && line !== 'Linked:',
  );

  return {
    header,
    board,
    ...R.getSomes({
      owner: Arr.findFirst(lines, Str.startsWith('Owner: ')),
      description: Arr.findFirst(lines, Str.startsWith('Description: ')),
      checklist: Arr.findFirst(lines, Str.startsWith('Checklist: ')),
    }),
    labels: Arr.filter(lines, Str.startsWith('Label: ')),
    linked: Arr.filter(lines, (line) => !FIELD.test(line)),
  };
}

export const ListBoards = {
  name: 'ListBoards',
  args: Schema.Struct({ search: Schema.String.pipe(Schema.optionalKey), limit: Schema.Int }),
  result: Lines(BoardLine, /^\d+ board\(s\):$/, /^No boards found\.$/),
};

export const ListBoardLists = {
  name: 'ListBoardLists',
  args: Schema.Struct({ boardId: ApiId }),
  result: Lines(ListLine),
};

export const ListTodos = {
  name: 'ListTodos',
  args: Schema.Struct({ boardId: ApiId, state: Schema.Literals(['open', 'all']), limit: Schema.Int }),
  result: Lines(CardLine, /^\d+ card\(s\):$/, /^No cards match\.$/),
};

export const GetTodoDetail = {
  name: 'GetTodoDetail',
  args: Schema.Struct({ todoId: ApiId }),
  result: Schema.String.pipe(
    Schema.decodeTo(DetailText, {
      decode: SchemaGetter.transform(detailSections),
      encode: SchemaGetter.forbiddenEncoding,
    }),
    Schema.decodeTo(CardDetail, {
      decode: SchemaGetter.transform(({ header, board, owner, description, checklist, labels, linked }) => ({
        ...header,
        ...board,
        ...owner,
        ...(P.isUndefined(description) ? {} : { description: description.text }),
        ...(P.isUndefined(checklist) ? {} : { checklist: checklist.text }),
        labels,
        linked,
      })),
      encode: SchemaGetter.forbiddenEncoding,
    }),
  ),
};

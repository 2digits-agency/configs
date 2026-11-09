import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';
import * as Struct from 'effect/Struct';
import * as Tool from 'effect/ai/Tool';

import { Orbit } from '../orbit/Orbit.js';
import {
  Board,
  BoardList,
  type Card,
  CardFields,
  CardDetail,
  GetTodoDetail,
  ListBoardLists,
  ListBoards,
  ListTodos,
} from '../orbit/boards.js';
import { ApiId } from '../orbit/text.js';
import { OrbitReadError, toReadError } from './OrbitReadError.js';

const isApiId = Schema.is(ApiId);

export class BoardCard extends Schema.Class<BoardCard, { readonly brand: unique symbol }>('BoardCard')(
  Struct.assign(CardFields, {
    name: Schema.String,
    description: Schema.String.pipe(Schema.optionalKey),
    checklist: Schema.String.pipe(Schema.optionalKey),
    labels: CardDetail.fields.labels.pipe(Schema.optionalKey),
    linked: CardDetail.fields.linked.pipe(Schema.optionalKey),
  }),
) {}

export class BoardColumn extends Schema.Class<BoardColumn, { readonly brand: unique symbol }>('BoardColumn')({
  ...BoardList.fields,
  cards: Schema.Array(BoardCard),
}) {}

export class BoardContext extends Schema.Class<BoardContext, { readonly brand: unique symbol }>('BoardContext')({
  board: Board,
  columns: Schema.Array(BoardColumn).annotate({ description: 'In board order; column ids are MoveTodo targets' }),
  cardsTruncated: Schema.Boolean.annotate({
    description: 'Orbit returns at most 100 cards per board; true when that cap was reached, so cards may be missing',
  }),
}) {}

const CARD_LIMIT = 100;

const BOARD_LIMIT = 100;

export const GetBoardContext = Tool.make('GetBoardContext', {
  description:
    'Read-only view of one todo board in one call: its columns in order (api_ids for MoveTodo, done flag) with their cards, each with due date, owner and, unless details is false, description, checklist progress and linked tasks. Pass the board api_id or a name that matches exactly one board. Use Orbit write tools (MoveTodo, AddMessage) for changes.',
  parameters: Schema.Struct({
    board: Schema.String.annotate({ description: 'Board api_id, or (part of) its name' }),
    includeDone: Schema.Boolean.annotate({ description: 'Include done cards (default false)' }).pipe(
      Schema.withDecodingDefault(Effect.succeed(false)),
    ),
    details: Schema.Boolean.annotate({ description: 'Fetch card detail for every card (default true)' }).pipe(
      Schema.withDecodingDefault(Effect.succeed(true)),
    ),
  }),
  success: BoardContext,
  failure: OrbitReadError,
  failureMode: 'return',
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true);

/**
 * A card as ListTodos lists it (column, due, owner, priority), with its name and, when fetched, its detail.
 *
 * @param card
 * @param name
 * @param detail
 */
function boardCard(card: Card, name: string, detail: CardDetail | undefined) {
  return BoardCard.make({
    ...Struct.pick(card, ['id', 'boardId', 'listId', 'list', 'done', 'due', 'ownerId', 'priority']),
    name,
    ...(P.isUndefined(detail) ? {} : Struct.pick(detail, ['description', 'checklist', 'labels', 'linked'])),
  });
}

export const GetBoardContextHandler = Effect.gen(function* () {
  const orbit = yield* Orbit;

  return Effect.fn('GetBoardContext')(function* (params: Tool.Parameters<typeof GetBoardContext>) {
    const search = Str.trim(params.board);

    // ListBoards searches names only, so an api_id is looked up in the unfiltered list.
    const boards = yield* orbit.call(
      ListBoards,
      isApiId(search) ? { limit: BOARD_LIMIT } : { search, limit: BOARD_LIMIT },
    );

    const byId = Arr.filter(boards, ({ id }) => id === search);

    const exact = Arr.filter(boards, ({ name }) => Str.toLowerCase(name) === Str.toLowerCase(search));

    const matches = isApiId(search) ? byId : Arr.isReadonlyArrayNonEmpty(exact) ? exact : boards;

    const [board] = matches;

    if (P.isUndefined(board) || matches.length > 1) {
      return yield* Effect.fail(
        OrbitReadError.make({
          message: P.isUndefined(board)
            ? boards.length >= BOARD_LIMIT
              ? `No board matches "${search}" in the first ${BOARD_LIMIT} boards Orbit returned; pass the board name instead.`
              : `No board matches "${search}".`
            : `"${search}" matches ${matches.length} boards: ${Arr.join(
                Arr.map(matches, ({ id, name }) => `${name} (${id})`),
                '; ',
              )}. Pass the board api_id.`,
        }),
      );
    }

    const [lists, cards] = yield* Effect.all(
      [
        orbit.call(ListBoardLists, { boardId: board.id }),
        orbit.call(ListTodos, { boardId: board.id, state: params.includeDone ? 'all' : 'open', limit: CARD_LIMIT }),
      ],
      { concurrency: 'unbounded' },
    );

    // ListTodos and ListBoardLists are separate reads, so a card can sit in a column created in between.
    const listIds = new Set(Arr.map(lists, ({ id }) => id));

    const stray = Arr.filter(cards, ({ listId }) => !listIds.has(listId));

    if (Arr.isReadonlyArrayNonEmpty(stray)) {
      return yield* Effect.fail(
        OrbitReadError.make({
          message: `The board changed while it was read: ${Arr.join(
            Arr.map(stray, ({ id, list, listId }) => `card ${id} is in column ${list} (${listId})`),
            '; ',
          )}, which ListBoardLists did not return. Call GetBoardContext again.`,
        }),
      );
    }

    // ListTodos shows "<card> | <board>"; both names can contain " | ", so cut the known board name off the end.
    const suffix = ` | ${board.name}`;

    const unnamed = Arr.filter(cards, ({ heading }) => !Str.endsWith(suffix)(heading));

    if (!params.details && Arr.isReadonlyArrayNonEmpty(unnamed)) {
      return yield* Effect.fail(
        OrbitReadError.make({
          message: `Cannot split the card name from board "${board.name}" in: ${Arr.join(
            Arr.map(unnamed, ({ heading }) => JSON.stringify(heading)),
            '; ',
          )}. Call again with details: true.`,
        }),
      );
    }

    const details = params.details
      ? // oxlint-disable-next-line unicorn/no-array-for-each
        yield* Effect.forEach(cards, (card) => orbit.call(GetTodoDetail, { todoId: card.id }), { concurrency: 5 })
      : [];

    const boardCards = Arr.map(cards, (card, index) => {
      const detail = details[index];

      return boardCard(card, detail?.name ?? Str.slice(0, card.heading.length - suffix.length)(card.heading), detail);
    });

    return BoardContext.make({
      board,
      columns: Arr.map(lists, (list) =>
        BoardColumn.make({
          id: list.id,
          name: list.name,
          cardCount: list.cardCount,
          done: list.done,
          cards: Arr.filter(boardCards, ({ listId }) => listId === list.id),
        }),
      ),
      cardsTruncated: cards.length >= CARD_LIMIT,
    });
  }, Effect.mapError(toReadError));
});

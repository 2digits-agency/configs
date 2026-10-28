import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';
import * as Tool from 'effect/ai/Tool';

import type { OrbitShape } from '../orbit/Orbit.js';
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
import { ApiId, definedKey } from '../orbit/text.js';
import { OrbitReadError, toReadError } from './OrbitReadError.js';

const isApiId = Schema.is(ApiId);

export class BoardCard extends Schema.Class<BoardCard, { readonly brand: unique symbol }>('BoardCard')({
  ...CardFields,
  description: Schema.String.pipe(Schema.optionalKey),
  checklist: Schema.String.pipe(Schema.optionalKey),
  labels: CardDetail.fields.labels.pipe(Schema.optionalKey),
  linked: CardDetail.fields.linked.pipe(Schema.optionalKey),
}) {}

export class BoardColumn extends Schema.Class<BoardColumn, { readonly brand: unique symbol }>('BoardColumn')({
  ...BoardList.fields,
  cards: Schema.Array(BoardCard),
}) {}

export class BoardContext extends Schema.Class<BoardContext, { readonly brand: unique symbol }>('BoardContext')({
  board: Board,
  columns: Schema.Array(BoardColumn).annotate({ description: 'In board order; column ids are MoveTodo targets' }),
}) {}

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

function boardCard(card: Card | CardDetail) {
  const { id, name, boardId, listId, list, done } = card;

  return BoardCard.make({
    id,
    name,
    boardId,
    listId,
    list,
    done,
    ...definedKey('due', card.due),
    ...definedKey('ownerId', card.ownerId),
    ...('linked' in card
      ? {
          ...definedKey('description', card.description),
          ...definedKey('checklist', card.checklist),
          labels: card.labels,
          linked: card.linked,
        }
      : {}),
  });
}

export const getBoardContext = Effect.fn('GetBoardContext')(function* (
  orbit: OrbitShape,
  params: Tool.Parameters<typeof GetBoardContext>,
) {
  const search = Str.trim(params.board);

  // ListBoards searches names only, so an api_id is looked up in the unfiltered list.
  const boards = yield* orbit.call(ListBoards, isApiId(search) ? { limit: 100 } : { search, limit: 100 });

  const byId = Arr.filter(boards, ({ id }) => id === search);

  const exact = Arr.filter(boards, ({ name }) => Str.toLowerCase(name) === Str.toLowerCase(search));

  const matches = isApiId(search) ? byId : exact.length > 0 ? exact : boards;

  const [board] = matches;

  if (board === undefined || matches.length > 1) {
    return yield* Effect.fail(
      OrbitReadError.make({
        message:
          board === undefined
            ? `No board matches "${search}".`
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
      orbit.call(ListTodos, { boardId: board.id, state: params.includeDone ? 'all' : 'open', limit: 100 }),
    ],
    { concurrency: 'unbounded' },
  );

  const detailed: ReadonlyArray<Card | CardDetail> = params.details
    ? // oxlint-disable-next-line unicorn/no-array-for-each
      yield* Effect.forEach(cards, (card) => orbit.call(GetTodoDetail, { todoId: card.id }), { concurrency: 5 })
    : cards;

  return BoardContext.make({
    board,
    columns: Arr.map(lists, (list) =>
      BoardColumn.make({
        id: list.id,
        name: list.name,
        cardCount: list.cardCount,
        done: list.done,
        cards: Arr.map(
          Arr.filter(detailed, ({ listId }) => listId === list.id),
          boardCard,
        ),
      }),
    ),
  });
}, Effect.mapError(toReadError));

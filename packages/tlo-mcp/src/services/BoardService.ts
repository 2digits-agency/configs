import * as Arr from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Match from 'effect/Match';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import {
  GetBoardTodosResponse,
  GetMessagesResponse,
  GetProjectDetailsResponse,
  GetProjectsResponse,
  GetTasksForUserResponse,
  GetTasksResponse,
  messageFromRaw,
  projectFromRaw,
  taskForUserFromRaw,
  taskFromRaw,
  TodoDetail as TodoDetailSchema,
  todoSummaryFromRaw,
  type GetBoardTodosParams,
  type GetMessagesParams,
  type GetProjectDetailsParams,
  type GetProjectsParams,
  type GetTasksForUserParams,
  type GetTasksParams,
  type GetTodoDetailParams,
  type Message,
  type MoveTodoParams,
  type PostMessageParams,
  type Project,
  type SetTaskStateParams,
  type Task,
  type TaskForUser,
  type TodoDetail,
  type TodoSummary,
} from '../schemas/board.js';
import type { TloError } from '../schemas/errors.js';
import { TeamLeaderClient } from './TeamLeaderClient.js';

export interface BoardServiceShape {
  readonly getProjects: (params?: GetProjectsParams) => Effect.Effect<ReadonlyArray<Project>, TloError>;

  readonly getProjectDetails: (params: GetProjectDetailsParams) => Effect.Effect<Project, TloError>;

  readonly getMessages: (params: GetMessagesParams) => Effect.Effect<ReadonlyArray<Message>, TloError>;

  readonly getTasks: (params: GetTasksParams) => Effect.Effect<ReadonlyArray<Task>, TloError>;

  readonly getTasksForUser: (params: GetTasksForUserParams) => Effect.Effect<ReadonlyArray<TaskForUser>, TloError>;

  readonly getTodoDetail: (params: GetTodoDetailParams) => Effect.Effect<TodoDetail, TloError>;

  readonly getBoardTodos: (params: GetBoardTodosParams) => Effect.Effect<ReadonlyArray<TodoSummary>, TloError>;

  readonly moveTodo: (params: MoveTodoParams) => Effect.Effect<void, TloError>;

  readonly postMessage: (params: PostMessageParams) => Effect.Effect<void, TloError>;

  readonly setTaskState: (params: SetTaskStateParams) => Effect.Effect<void, TloError>;
}

export class BoardService extends Context.Service<BoardService, BoardServiceShape>()(
  '@2digits/tlo-mcp/services/BoardService',
) {}

function formatRequestDate(d: Date): string {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export const BoardServiceLive = Layer.effect(
  BoardService,
  Effect.gen(function* () {
    const client = yield* TeamLeaderClient;

    return BoardService.of({
      getProjects: Effect.fn('BoardService.getProjects')(function* (params: GetProjectsParams = {}) {
        const states = params.states ?? ['DRAFT', 'OPEN', 'CLOSED'];

        const response = yield* client.post(
          '/ajax/pln/GetProjects',
          {
            STATE: Arr.join(states, '|'),
            COLUMNS:
              'ID|PROJECT_NAME|NAME|STATE|OWNER_NAME|START_DT|END_DT|BILLING_BUDGET|BILLING_MODE|BILLING_REMAINING|CLIENT_NAME|CLIENT_ID|FOLDERID|FOLDER_NAME|EXTID|CALC_TOTAL|CALC_DONE|CALC_PLANNED',
            limit: params.limit ?? 100,
            page: params.page ?? 1,
          },
          GetProjectsResponse,
        );

        return Arr.map(projectFromRaw)(response.Records);
      }),

      getProjectDetails: Effect.fn('BoardService.getProjectDetails')(function* (params: GetProjectDetailsParams) {
        const response = yield* client.post(
          '/ajax/pln/GetProjectDetails',
          { ID: params.projectId },
          GetProjectDetailsResponse,
        );
        const project = Match.value(response).pipe(
          Match.when({ Record: Match.any }, ({ Record }) => Record),
          Match.orElse((project) => project),
        );

        return projectFromRaw(project);
      }),

      getMessages: Effect.fn('BoardService.getMessages')(function* (params: GetMessagesParams) {
        const messages = yield* client.post(
          '/ajax/board/ProcessMessage',
          {
            OBJECTTYPE: params.objectType,
            OBJECTID: params.objectId,
            ONLYCOMMENTS: params.onlyComments === false ? 0 : 1,
            HIDEINTERNAL: params.hideInternal === false ? 0 : 1,
            PAGETYPE: 'SEQID',
            MINID: 0,
            limit: params.limit ?? 100,
          },
          GetMessagesResponse,
        );

        return Arr.map(messageFromRaw)(messages);
      }),

      getTasks: Effect.fn('BoardService.getTasks')(function* (params: GetTasksParams) {
        const states = params.states ?? ['DRAFT', 'OPEN', 'CLOSED'];

        const response = yield* client.post(
          '/ajax/pln/GetTasks',
          {
            PROJECTID: params.projectId,
            STATE: Arr.join(states, '|'),
            COLUMNS: 'ID|PROJECTID|NAME|STATE|OWNER_NAME|START_DT|END_DT|BUDGET',
            limit: params.limit ?? 100,
            page: params.page ?? 1,
          },
          GetTasksResponse,
        );

        return Arr.map(taskFromRaw)(response.Records);
      }),

      getTasksForUser: Effect.fn('BoardService.getTasksForUser')(function* (params: GetTasksForUserParams) {
        const response = yield* client.post(
          '/ajax/pln/GetTasksForUser',
          {
            CONTACTID: params.contactId,
            START_DT: formatRequestDate(params.startDate),
            PERIOD: params.period,
          },
          GetTasksForUserResponse,
        );

        return Arr.map(taskForUserFromRaw)(response.Records);
      }),

      getTodoDetail: Effect.fn('BoardService.getTodoDetail')(function* (params: GetTodoDetailParams) {
        return yield* client.post('/ajax/board/GetTodoDetail', { ID: params.id }, TodoDetailSchema);
      }),

      getBoardTodos: Effect.fn('BoardService.getBoardTodos')(function* (params: GetBoardTodosParams) {
        const response = yield* client.post(
          '/ajax/board/GetTodos',
          {
            BOARDID: params.boardId,
            BOARDLISTID: params.boardListId,
            limit: params.limit ?? 100,
          },
          GetBoardTodosResponse,
        );
        const todos = Arr.map(todoSummaryFromRaw)(response.Records);

        return Match.value(params.query).pipe(
          Match.when(Match.nonEmptyString, (query) => {
            const normalizedQuery = Str.toLowerCase(query);

            // oxlint-disable-next-line unicorn/no-array-method-this-argument -- Effect Array.filter is data-first.
            return Arr.filter(todos, (todo) =>
              todo.name === undefined ? false : Str.includes(normalizedQuery)(Str.toLowerCase(todo.name)),
            );
          }),
          Match.orElse(() => todos),
        );
      }),

      moveTodo: Effect.fn('BoardService.moveTodo')(function* (params: MoveTodoParams) {
        yield* client.post(
          '/ajax/board/MoveTodo',
          {
            ID: params.id,
            BOARDID: params.boardId,
            BOARDLISTID: params.boardListId,
            SORTINDEX: params.sortIndex,
          },
          Schema.Unknown,
        );
      }),

      postMessage: Effect.fn('BoardService.postMessage')(function* (params: PostMessageParams) {
        yield* client.post(
          '/ajax/board/ProcessMessage',
          {
            ACTION: 'ADD',
            OBJECTTYPE: params.objectType,
            OBJECTID: params.objectId,
            CONTENT: params.content,
          },
          Schema.Unknown,
        );
      }),

      setTaskState: Effect.fn('BoardService.setTaskState')(function* (params: SetTaskStateParams) {
        yield* client.post(
          '/ajax/pln/SetTaskState',
          {
            PROJECTID: params.projectId,
            ID: params.taskId,
            STATE: params.state,
          },
          Schema.Unknown,
        );
      }),
    });
  }),
);

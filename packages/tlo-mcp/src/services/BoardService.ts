import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import {
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
  type TaskForUserRaw,
  type TodoDetail,
} from '../schemas/board.js';
import type { TloError } from '../schemas/errors.js';
import { TeamLeaderClient } from './TeamLeaderClient.js';

export interface BoardServiceShape {
  readonly getProjects: (params?: GetProjectsParams) => Effect.Effect<ReadonlyArray<typeof Project.Type>, TloError>;

  readonly getProjectDetails: (params: GetProjectDetailsParams) => Effect.Effect<typeof Project.Type, TloError>;

  readonly getMessages: (params: GetMessagesParams) => Effect.Effect<ReadonlyArray<typeof Message.Type>, TloError>;

  readonly getTasks: (params: GetTasksParams) => Effect.Effect<ReadonlyArray<typeof Task.Type>, TloError>;

  readonly getTasksForUser: (
    params: GetTasksForUserParams,
  ) => Effect.Effect<ReadonlyArray<typeof TaskForUser.Type>, TloError>;

  readonly getTodoDetail: (params: GetTodoDetailParams) => Effect.Effect<TodoDetail, TloError>;

  readonly moveTodo: (params: MoveTodoParams) => Effect.Effect<void, TloError>;

  readonly postMessage: (params: PostMessageParams) => Effect.Effect<void, TloError>;

  readonly setTaskState: (params: SetTaskStateParams) => Effect.Effect<void, TloError>;
}

export class BoardService extends Context.Tag('@2digits/tlo-mcp/services/BoardService')<
  BoardService,
  BoardServiceShape
>() {}

function formatRequestDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getTasksForUserRecords(response: GetTasksForUserResponse): ReadonlyArray<TaskForUserRaw> {
  return response.Records;
}

export const BoardServiceLive = Layer.effect(
  BoardService,
  Effect.gen(function* () {
    const client = yield* TeamLeaderClient;

    return BoardService.of({
      getProjects: Effect.fn('BoardService.getProjects')(function* (params: GetProjectsParams = {}) {
        const states = params.states ?? ['DRAFT', 'OPEN', 'CLOSED'];

        return yield* client
          .post(
            '/ajax/pln/GetProjects',
            {
              STATE: states.join('|'),
              COLUMNS:
                'ID|PROJECT_NAME|NAME|STATE|OWNER_NAME|START_DT|END_DT|BILLING_BUDGET|BILLING_MODE|BILLING_REMAINING|CLIENT_NAME|CLIENT_ID|FOLDERID|FOLDER_NAME|EXTID|CALC_TOTAL|CALC_DONE|CALC_PLANNED',
              limit: params.limit ?? 100,
              page: params.page ?? 1,
            },
            GetProjectsResponse,
          )
          .pipe(Effect.map((response) => response.Records.map((raw) => projectFromRaw(raw))));
      }),

      getProjectDetails: Effect.fn('BoardService.getProjectDetails')(function* (params) {
        return yield* client
          .post('/ajax/pln/GetProjectDetails', { ID: params.projectId }, GetProjectDetailsResponse)
          .pipe(
            Effect.map((response) => ('Record' in response ? response.Record : response)),
            Effect.map((raw) => projectFromRaw(raw)),
          );
      }),

      getMessages: Effect.fn('BoardService.getMessages')(function* (params) {
        return yield* client
          .post(
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
          )
          .pipe(Effect.map((messages) => messages.map((raw) => messageFromRaw(raw))));
      }),

      getTasks: Effect.fn('BoardService.getTasks')(function* (params) {
        const states = params.states ?? ['DRAFT', 'OPEN', 'CLOSED'];

        return yield* client
          .post(
            '/ajax/pln/GetTasks',
            {
              PROJECTID: params.projectId,
              STATE: states.join('|'),
              COLUMNS: 'ID|PROJECTID|NAME|STATE|OWNER_NAME|START_DT|END_DT|BUDGET',
              limit: params.limit ?? 100,
              page: params.page ?? 1,
            },
            GetTasksResponse,
          )
          .pipe(Effect.map((response) => response.Records.map((raw) => taskFromRaw(raw))));
      }),

      getTasksForUser: Effect.fn('BoardService.getTasksForUser')(function* (params) {
        return yield* client
          .post(
            '/ajax/pln/GetTasksForUser',
            {
              CONTACTID: params.contactId,
              START_DT: formatRequestDate(params.startDate),
              PERIOD: params.period,
            },
            GetTasksForUserResponse,
          )
          .pipe(
            Effect.map((response) => getTasksForUserRecords(response)),
            Effect.map((records) => records.map((raw) => taskForUserFromRaw(raw))),
          );
      }),

      getTodoDetail: Effect.fn('BoardService.getTodoDetail')(function* (params) {
        return yield* client.post('/ajax/board/GetTodoDetail', { ID: params.id }, TodoDetailSchema);
      }),

      moveTodo: Effect.fn('BoardService.moveTodo')(function* (params) {
        return yield* client
          .post(
            '/ajax/board/MoveTodo',
            {
              ID: params.id,
              BOARDID: params.boardId,
              BOARDLISTID: params.boardListId,
              SORTINDEX: params.sortIndex,
            },
            Schema.Unknown,
          )
          .pipe(Effect.asVoid);
      }),

      postMessage: Effect.fn('BoardService.postMessage')(function* (params) {
        return yield* client
          .post(
            '/ajax/board/ProcessMessage',
            {
              ACTION: 'ADD',
              OBJECTTYPE: params.objectType,
              OBJECTID: params.objectId,
              CONTENT: params.content,
            },
            Schema.Unknown,
          )
          .pipe(Effect.asVoid);
      }),

      setTaskState: Effect.fn('BoardService.setTaskState')(function* (params) {
        return yield* client
          .post(
            '/ajax/pln/SetTaskState',
            {
              PROJECTID: params.projectId,
              ID: params.taskId,
              STATE: params.state,
            },
            Schema.Unknown,
          )
          .pipe(Effect.asVoid);
      }),
    });
  }),
);

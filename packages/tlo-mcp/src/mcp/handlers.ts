import * as Toolkit from '@effect/ai/Toolkit';
import * as Effect from 'effect/Effect';

import { BoardService } from '../services/BoardService.js';
import { TimeService } from '../services/TimeService.js';
import {
  CreateActivity,
  DeleteActivity,
  GetMessages,
  GetProjectDetails,
  GetProjects,
  GetTasks,
  GetTasksForUser,
  GetTodoDetail,
  GetWeekActivities,
  MoveTodo,
  PostMessage,
  SetTaskState,
  UpdateActivity,
} from './tools.js';

export const TloToolkit = Toolkit.make(
  GetProjects,
  GetProjectDetails,
  GetMessages,
  GetTasks,
  GetTasksForUser,
  GetTodoDetail,
  MoveTodo,
  PostMessage,
  SetTaskState,
  GetWeekActivities,
  CreateActivity,
  UpdateActivity,
  DeleteActivity,
);

const DEFAULT_PROJECT_STATES = ['DRAFT', 'OPEN', 'CLOSED'] as const;
const DEFAULT_LIMIT = 100;
const DEFAULT_PAGE = 1;
const DEFAULT_TIMEZONE = 'Europe/Amsterdam';

export const TloToolkitHandlers = TloToolkit.toLayer({
  get_projects: Effect.fn('TloToolkitHandlers.get_projects')(function* (params) {
    const boardService = yield* BoardService;

    const projects = yield* boardService.getProjects({
      ...params,
      states: params.states ?? [...DEFAULT_PROJECT_STATES],
      limit: params.limit ?? DEFAULT_LIMIT,
      page: params.page ?? DEFAULT_PAGE,
    });

    return { projects };
  }),

  get_project_details: Effect.fn('TloToolkitHandlers.get_project_details')(function* (params) {
    const boardService = yield* BoardService;

    const project = yield* boardService.getProjectDetails(params);

    return { project };
  }),

  get_messages: Effect.fn('TloToolkitHandlers.get_messages')(function* (params) {
    const boardService = yield* BoardService;

    const messages = yield* boardService.getMessages({
      ...params,
      onlyComments: params.onlyComments ?? true,
      hideInternal: params.hideInternal ?? true,
      limit: params.limit ?? DEFAULT_LIMIT,
    });

    return { messages };
  }),

  set_task_state: Effect.fn('TloToolkitHandlers.set_task_state')(function* (params) {
    const boardService = yield* BoardService;

    yield* boardService.setTaskState(params);
  }),

  get_tasks: Effect.fn('TloToolkitHandlers.get_tasks')(function* (params) {
    const boardService = yield* BoardService;

    const tasks = yield* boardService.getTasks({
      ...params,
      states: params.states ?? [...DEFAULT_PROJECT_STATES],
      limit: params.limit ?? DEFAULT_LIMIT,
      page: params.page ?? DEFAULT_PAGE,
    });

    return { tasks };
  }),

  get_tasks_for_user: Effect.fn('TloToolkitHandlers.get_tasks_for_user')(function* (params) {
    const boardService = yield* BoardService;

    const tasks = yield* boardService.getTasksForUser(params);

    return { tasks };
  }),

  get_todo_detail: Effect.fn('TloToolkitHandlers.get_todo_detail')(function* (params) {
    const boardService = yield* BoardService;

    const todo = yield* boardService.getTodoDetail(params);

    return { todo };
  }),

  move_todo: Effect.fn('TloToolkitHandlers.move_todo')(function* (params) {
    const boardService = yield* BoardService;

    yield* boardService.moveTodo(params);
  }),

  post_message: Effect.fn('TloToolkitHandlers.post_message')(function* (params) {
    const boardService = yield* BoardService;

    yield* boardService.postMessage(params);
  }),

  get_week_activities: Effect.fn('TloToolkitHandlers.get_week_activities')(function* (params) {
    const timeService = yield* TimeService;
    const timezone = params.timezone ?? DEFAULT_TIMEZONE;

    const activities = yield* timeService.getWeek(params.date, params.contactId, timezone);

    return { activities };
  }),

  create_activity: Effect.fn('TloToolkitHandlers.create_activity')(function* (params) {
    const timeService = yield* TimeService;

    const id = yield* timeService.createActivity(params);

    return { id };
  }),

  update_activity: Effect.fn('TloToolkitHandlers.update_activity')(function* (params) {
    const timeService = yield* TimeService;

    yield* timeService.updateActivity(params);
  }),

  delete_activity: Effect.fn('TloToolkitHandlers.delete_activity')(function* (params) {
    const timeService = yield* TimeService;

    yield* timeService.deleteActivity(params);
  }),
});

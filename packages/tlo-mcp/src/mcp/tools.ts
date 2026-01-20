import * as Tool from '@effect/ai/Tool';
import * as Schema from 'effect/Schema';

import { Message, Project, Task, TaskForUser, TodoDetail, TodoSummary } from '../schemas/board.js';
import { TloErrorSchema } from '../schemas/errors.js';
import { Activity } from '../schemas/time.js';
import { BoardService } from '../services/BoardService.js';
import { TimeService } from '../services/TimeService.js';

const TaskStateSchema = Schema.Literal('DRAFT', 'OPEN', 'COMPLETED', 'CLOSED');

const ObjectTypeSchema = Schema.Literal('TODO', 'BOARD', 'PROJECT');

const IsoDate = Schema.Date.annotations({
  description: 'ISO 8601 date string (e.g., 2025-01-20T10:00:00Z)',
});

export const GetProjects = Tool.make('get_projects', {
  description:
    'List all projects. Returns projectId, folderId, client, owner, dates, and budget info. Use to discover projects before drilling into tasks or logging time. Data hierarchy: FOLDER → PROJECT → TASK → ACTIVITY.',
  parameters: {
    states: Schema.optional(Schema.Array(TaskStateSchema)).annotations({
      description: 'Filter by project states: DRAFT, OPEN, COMPLETED, CLOSED. Defaults to DRAFT, OPEN, CLOSED',
    }),
    limit: Schema.optional(Schema.Number).annotations({
      description: 'Maximum number of projects to return. Defaults to 100',
    }),
    page: Schema.optional(Schema.Number).annotations({
      description: 'Page number for pagination. Defaults to 1',
    }),
  },
  success: Schema.Struct({ projects: Schema.Array(Project) }),
  failure: TloErrorSchema,
  failureMode: 'return',
  dependencies: [BoardService],
});

export const GetProjectDetails = Tool.make('get_project_details', {
  description:
    'Get single project with full details including billing rates and folder info. Requires projectId from get_projects.',
  parameters: {
    projectId: Schema.Number.annotations({ description: 'Project ID from get_projects response' }),
  },
  success: Schema.Struct({ project: Project }),
  failure: TloErrorSchema,
  failureMode: 'return',
  dependencies: [BoardService],
});

export const GetMessages = Tool.make('get_messages', {
  description:
    'Get comments/messages on a project, board, or todo. Use to read discussion history or context about work items.',
  parameters: {
    objectType: ObjectTypeSchema.annotations({
      description: 'Type of object: PROJECT (for project comments), BOARD (board-level), TODO (kanban card)',
    }),
    objectId: Schema.Number.annotations({ description: 'ID of the project, board, or todo' }),
    onlyComments: Schema.optional(Schema.Boolean).annotations({
      description: 'Only return user comments (exclude system messages). Defaults to true',
    }),
    hideInternal: Schema.optional(Schema.Boolean).annotations({
      description: 'Hide internal/private messages. Defaults to true',
    }),
    limit: Schema.optional(Schema.Number).annotations({
      description: 'Maximum number of messages to return. Defaults to 100',
    }),
  },
  success: Schema.Struct({ messages: Schema.Array(Message) }),
  failure: TloErrorSchema,
  failureMode: 'return',
  dependencies: [BoardService],
});

export const SetTaskState = Tool.make('set_task_state', {
  description:
    'Change task state. Typical flow: DRAFT → OPEN → COMPLETED → CLOSED. Requires both projectId and taskId from get_tasks.',
  parameters: {
    projectId: Schema.Number.annotations({ description: 'Project ID containing the task (from get_projects)' }),
    taskId: Schema.Number.annotations({ description: 'Task ID to update (from get_tasks)' }),
    state: TaskStateSchema.annotations({ description: 'New state: DRAFT, OPEN, COMPLETED, or CLOSED' }),
  },
  success: Schema.Void,
  failure: TloErrorSchema,
  failureMode: 'return',
  dependencies: [BoardService],
});

export const GetTasks = Tool.make('get_tasks', {
  description:
    'Get tasks within a project. Tasks have budget (workload), remaining hours, and state. Use taskId when logging time to attribute work to specific deliverables.',
  parameters: {
    projectId: Schema.Number.annotations({ description: 'Project ID from get_projects' }),
    states: Schema.optional(Schema.Array(TaskStateSchema)).annotations({
      description: 'Filter by task states: DRAFT, OPEN, COMPLETED, CLOSED. Defaults to DRAFT, OPEN, CLOSED',
    }),
    limit: Schema.optional(Schema.Number).annotations({
      description: 'Maximum number of tasks to return. Defaults to 100',
    }),
    page: Schema.optional(Schema.Number).annotations({
      description: 'Page number for pagination. Defaults to 1',
    }),
  },
  success: Schema.Struct({ tasks: Schema.Array(Task) }),
  failure: TloErrorSchema,
  failureMode: 'return',
  dependencies: [BoardService],
});

export const GetTasksForUser = Tool.make('get_tasks_for_user', {
  description:
    'Get tasks assigned to a user for a date range. Returns tasks with REMAINING budget hours. Useful for finding what work is available to log time against.',
  parameters: {
    contactId: Schema.String.annotations({ description: 'User/contact ID to get tasks for' }),
    startDate: IsoDate.annotations({ description: 'Start date for the query (e.g., 2025-01-20T00:00:00Z)' }),
    period: Schema.Number.annotations({ description: 'Number of days to include in the query' }),
  },
  success: Schema.Struct({ tasks: Schema.Array(TaskForUser) }),
  failure: TloErrorSchema,
  failureMode: 'return',
  dependencies: [BoardService],
});

export const GetTodoDetail = Tool.make('get_todo_detail', {
  description:
    'Get kanban card details. Response includes: BOARDLISTS (all columns with IDs for move_todo), LINKS (connected tasks), ACTIVITIES (time logged against this todo).',
  parameters: {
    id: Schema.Number.annotations({ description: 'Todo/card ID to retrieve' }),
  },
  success: Schema.Struct({ todo: TodoDetail }),
  failure: TloErrorSchema,
  failureMode: 'return',
  dependencies: [BoardService],
});

export const GetBoardTodos = Tool.make('get_board_todos', {
  description:
    'List todos/cards from a kanban board. Use to find todo IDs by name for use with get_todo_detail. Get boardId from get_todo_detail BOARDID field or project board URL.',
  parameters: {
    boardId: Schema.Number.annotations({
      description: 'Board ID (from get_todo_detail TODO.BOARDID field or URL)',
    }),
    query: Schema.optional(Schema.String).annotations({
      description: 'Filter todos by name (case-insensitive partial match)',
    }),
    boardListId: Schema.optional(Schema.Number).annotations({
      description: 'Filter by column ID (from BOARDLISTS in get_todo_detail)',
    }),
    limit: Schema.optional(Schema.Number).annotations({
      description: 'Maximum results. Defaults to 100',
    }),
  },
  success: Schema.Struct({ todos: Schema.Array(TodoSummary) }),
  failure: TloErrorSchema,
  failureMode: 'return',
  dependencies: [BoardService],
});

export const MoveTodo = Tool.make('move_todo', {
  description:
    'Move kanban card between columns. Get boardId and boardListId from get_todo_detail response (BOARDLISTS array contains column IDs).',
  parameters: {
    id: Schema.Number.annotations({ description: 'Todo/card ID to move' }),
    boardId: Schema.Number.annotations({ description: 'Board ID (from get_todo_detail)' }),
    boardListId: Schema.Number.annotations({ description: 'Target column ID (from BOARDLISTS in get_todo_detail)' }),
    sortIndex: Schema.Number.annotations({ description: 'Position within column (0 = top)' }),
  },
  success: Schema.Void,
  failure: TloErrorSchema,
  failureMode: 'return',
  dependencies: [BoardService],
});

export const PostMessage = Tool.make('post_message', {
  description: 'Add a comment to a project, board, or todo. Use to leave notes or updates on work items.',
  parameters: {
    objectType: ObjectTypeSchema.annotations({
      description: 'Type of object: PROJECT, BOARD, or TODO',
    }),
    objectId: Schema.Number.annotations({ description: 'ID of the project, board, or todo to comment on' }),
    content: Schema.String.annotations({ description: 'Comment text to post' }),
  },
  success: Schema.Void,
  failure: TloErrorSchema,
  failureMode: 'return',
  dependencies: [BoardService],
});

export const GetWeekActivities = Tool.make('get_week_activities', {
  description:
    'Get all time entries for the week containing the given date. Returns project/task names, duration, and IDs. Use to review or summarize work. Response includes folderId which can be used for create_activity.',
  parameters: {
    date: IsoDate.annotations({
      description: 'Any date within target week (e.g., 2025-01-20). Week is Mon-Sun.',
    }),
    contactId: Schema.String.annotations({ description: 'User/contact ID to get activities for' }),
    timezone: Schema.optional(Schema.String).annotations({
      description: 'Timezone for week boundaries. Defaults to Europe/Amsterdam',
    }),
  },
  success: Schema.Struct({ activities: Schema.Array(Activity) }),
  failure: TloErrorSchema,
  failureMode: 'return',
  dependencies: [TimeService],
});

export const CreateActivity = Tool.make('create_activity', {
  description:
    'Log time against a project/task. Get folderId from get_projects or get_week_activities. Duration examples: 60=1h, 90=1.5h, 120=2h. Optionally link to a taskId for specific work attribution or todoId for kanban card.',
  parameters: {
    folderId: Schema.String.annotations({
      description: 'Folder/project ID to log time against (from get_projects or get_week_activities)',
    }),
    startDate: IsoDate.annotations({
      description: 'Date and time of the activity (e.g., 2025-01-20T09:00:00Z). Time is for display.',
    }),
    durationMinutes: Schema.Number.annotations({
      description: 'Duration in minutes. Examples: 30, 60 (1h), 90 (1.5h), 120 (2h)',
    }),
    contactId: Schema.String.annotations({ description: 'User/contact ID who performed the work' }),
    taskId: Schema.optional(Schema.String).annotations({
      description: 'Task ID to attribute time to (from get_tasks). Links time to specific deliverable.',
    }),
    todoId: Schema.optional(Schema.String).annotations({
      description: 'Todo/kanban card ID to link this time entry to',
    }),
    description: Schema.optional(Schema.String).annotations({ description: 'Description of work performed' }),
    clientColor: Schema.optional(Schema.String).annotations({
      description: 'Hex color code for display (e.g., #eeeeee)',
    }),
  },
  success: Schema.Struct({ id: Schema.Number.annotations({ description: 'ID of the created activity' }) }),
  failure: TloErrorSchema,
  failureMode: 'return',
  dependencies: [TimeService],
});

export const UpdateActivity = Tool.make('update_activity', {
  description:
    'Modify an existing time entry. Get activity ID from get_week_activities. Only specify fields you want to change.',
  parameters: {
    id: Schema.Number.annotations({ description: 'Activity ID to update (from get_week_activities)' }),
    startDate: Schema.optional(IsoDate).annotations({ description: 'New date/time for the activity' }),
    durationMinutes: Schema.optional(Schema.Number).annotations({ description: 'New duration in minutes' }),
    description: Schema.optional(Schema.String).annotations({ description: 'New description' }),
  },
  success: Schema.Void,
  failure: TloErrorSchema,
  failureMode: 'return',
  dependencies: [TimeService],
});

export const DeleteActivity = Tool.make('delete_activity', {
  description: 'Remove a time entry. Get activity ID from get_week_activities. This action cannot be undone.',
  parameters: {
    id: Schema.Number.annotations({ description: 'Activity ID to delete (from get_week_activities)' }),
  },
  success: Schema.Void,
  failure: TloErrorSchema,
  failureMode: 'return',
  dependencies: [TimeService],
});

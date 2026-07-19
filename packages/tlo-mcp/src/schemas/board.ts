import * as Schema from 'effect/Schema';

export type ProjectRaw = Schema.Type<typeof ProjectRaw>;
export const ProjectRaw = Schema.Struct({
  ID: Schema.Number,
  PROJECT_NAME: Schema.optional(Schema.String),
  NAME: Schema.optional(Schema.String),
  STATE: Schema.optional(Schema.String),
  OWNER_NAME: Schema.optional(Schema.String),
  START_DT: Schema.optional(Schema.String),
  END_DT: Schema.optional(Schema.String),
  BILLING_BUDGET: Schema.optional(Schema.Number),
  BILLING_MODE: Schema.optional(Schema.String),
  BILLING_REMAINING: Schema.optional(Schema.Number),
  CLIENT_NAME: Schema.optional(Schema.String),
  CLIENT_ID: Schema.optional(Schema.Number),
  FOLDERID: Schema.optional(Schema.Number),
  FOLDER_NAME: Schema.optional(Schema.String),
  EXTID: Schema.optional(Schema.String),
  CALC_TOTAL: Schema.optional(Schema.Number),
  CALC_DONE: Schema.optional(Schema.Number),
  CALC_PLANNED: Schema.optional(Schema.Number),
});

export type GetProjectsResponse = Schema.Type<typeof GetProjectsResponse>;
export const GetProjectsResponse = Schema.Struct({
  Records: Schema.Array(ProjectRaw),
  RecordCount: Schema.optional(Schema.Number),
});

export type GetProjectDetailsResponse = Schema.Type<typeof GetProjectDetailsResponse>;
export const GetProjectDetailsResponse = Schema.Union([ProjectRaw, Schema.Struct({ Record: ProjectRaw })]);

export class Project extends Schema.Class<Project>('Project')({
  id: Schema.Number,
  name: Schema.String,
  state: Schema.optional(Schema.String),
  ownerName: Schema.optional(Schema.String),
  startDate: Schema.optional(Schema.String),
  endDate: Schema.optional(Schema.String),
  billingBudget: Schema.optional(Schema.Number),
  billingMode: Schema.optional(Schema.String),
  billingRemaining: Schema.optional(Schema.Number),
  clientName: Schema.optional(Schema.String),
  clientId: Schema.optional(Schema.Number),
  folderId: Schema.optional(Schema.Number),
  folderName: Schema.optional(Schema.String),
  extId: Schema.optional(Schema.String),
  calcTotal: Schema.optional(Schema.Number),
  calcDone: Schema.optional(Schema.Number),
  calcPlanned: Schema.optional(Schema.Number),
}) {}

export function projectFromRaw(raw: ProjectRaw): Project {
  return Project.make({
    id: raw.ID,
    name: raw.PROJECT_NAME ?? raw.NAME ?? '',
    state: raw.STATE,
    ownerName: raw.OWNER_NAME,
    startDate: raw.START_DT,
    endDate: raw.END_DT,
    billingBudget: raw.BILLING_BUDGET,
    billingMode: raw.BILLING_MODE,
    billingRemaining: raw.BILLING_REMAINING,
    clientName: raw.CLIENT_NAME,
    clientId: raw.CLIENT_ID,
    folderId: raw.FOLDERID,
    folderName: raw.FOLDER_NAME,
    extId: raw.EXTID,
    calcTotal: raw.CALC_TOTAL,
    calcDone: raw.CALC_DONE,
    calcPlanned: raw.CALC_PLANNED,
  });
}

export type MessageRaw = Schema.Type<typeof MessageRaw>;
export const MessageRaw = Schema.Struct({
  ID: Schema.Number,
  OWNERID: Schema.optional(Schema.Number),
  OWNER_NAME: Schema.optional(Schema.String),
  AVATAR: Schema.optional(Schema.String),
  CREATED_DT: Schema.optional(Schema.String),
  CONTENT: Schema.optional(Schema.String),
  SUBCONTENT: Schema.optional(Schema.String),
  OBJECTTYPE: Schema.optional(Schema.String),
  OBJECTID: Schema.optional(Schema.Number),
  OBJECTNAME: Schema.optional(Schema.String),
  MSGTYPE: Schema.optional(Schema.String),
  LIKECNT: Schema.optional(Schema.Number),
  REPLYCNT: Schema.optional(Schema.Number),
  OUTQUEUEID: Schema.optional(Schema.String),
  INTERNAL: Schema.optional(Schema.Number),
});

export type GetMessagesResponse = Schema.Type<typeof GetMessagesResponse>;
export const GetMessagesResponse = Schema.Array(MessageRaw);

export class Message extends Schema.Class<Message>('Message')({
  id: Schema.Number,
  ownerId: Schema.optional(Schema.Number),
  ownerName: Schema.optional(Schema.String),
  avatar: Schema.optional(Schema.String),
  createdAt: Schema.optional(Schema.String),
  content: Schema.optional(Schema.String),
  subcontent: Schema.optional(Schema.String),
  objectType: Schema.optional(Schema.String),
  objectId: Schema.optional(Schema.Number),
  objectName: Schema.optional(Schema.String),
  messageType: Schema.optional(Schema.String),
  likeCount: Schema.optional(Schema.Number),
  replyCount: Schema.optional(Schema.Number),
  outQueueId: Schema.optional(Schema.String),
  internal: Schema.optional(Schema.Boolean),
}) {}

export function messageFromRaw(raw: MessageRaw): Schema.Type<typeof Message> {
  return new Message({
    id: raw.ID,
    ownerId: raw.OWNERID,
    ownerName: raw.OWNER_NAME,
    avatar: raw.AVATAR,
    createdAt: raw.CREATED_DT,
    content: raw.CONTENT,
    subcontent: raw.SUBCONTENT,
    objectType: raw.OBJECTTYPE,
    objectId: raw.OBJECTID,
    objectName: raw.OBJECTNAME,
    messageType: raw.MSGTYPE,
    likeCount: raw.LIKECNT,
    replyCount: raw.REPLYCNT,
    outQueueId: raw.OUTQUEUEID,
    internal: raw.INTERNAL === undefined ? undefined : raw.INTERNAL !== 0,
  });
}

export type TaskState = 'OPEN' | 'COMPLETED' | 'DRAFT' | 'CLOSED';

export type TaskRaw = Schema.Type<typeof TaskRaw>;
export const TaskRaw = Schema.Struct({
  ID: Schema.Number,
  PROJECTID: Schema.optional(Schema.Number),
  NAME: Schema.optional(Schema.String),
  STATE: Schema.optional(Schema.String),
  OWNER_NAME: Schema.optional(Schema.String),
  START_DT: Schema.optional(Schema.String),
  END_DT: Schema.optional(Schema.String),
  BUDGET: Schema.optional(Schema.Number),
});

export type GetTasksResponse = Schema.Type<typeof GetTasksResponse>;
export const GetTasksResponse = Schema.Struct({
  Records: Schema.Array(TaskRaw),
  RecordCount: Schema.optional(Schema.Number),
});

export class Task extends Schema.Class<Task>('Task')({
  id: Schema.Number,
  projectId: Schema.optional(Schema.Number),
  name: Schema.optional(Schema.String),
  state: Schema.optional(Schema.String),
  ownerName: Schema.optional(Schema.String),
  startDate: Schema.optional(Schema.String),
  endDate: Schema.optional(Schema.String),
  budget: Schema.optional(Schema.Number),
}) {}

export function taskFromRaw(raw: TaskRaw): Schema.Type<typeof Task> {
  return new Task({
    id: raw.ID,
    projectId: raw.PROJECTID,
    name: raw.NAME,
    state: raw.STATE,
    ownerName: raw.OWNER_NAME,
    startDate: raw.START_DT,
    endDate: raw.END_DT,
    budget: raw.BUDGET,
  });
}

export interface SetTaskStateParams {
  readonly projectId: number;
  readonly taskId: number;
  readonly state: TaskState;
}

export interface GetMessagesParams {
  readonly objectType: 'TODO' | 'BOARD' | 'PROJECT';
  readonly objectId: number;
  readonly onlyComments?: boolean;
  readonly hideInternal?: boolean;
  readonly limit?: number;
}

export interface GetProjectsParams {
  readonly states?: ReadonlyArray<TaskState>;
  readonly limit?: number;
  readonly page?: number;
}

export type TaskForUserRaw = Schema.Type<typeof TaskForUserRaw>;
export const TaskForUserRaw = Schema.Struct({
  ID: Schema.Number,
  WORKLOAD: Schema.optional(Schema.Number),
  TOTAL: Schema.optional(Schema.Number),
  REMAINING: Schema.optional(Schema.Number),
  AVAIL: Schema.optional(Schema.Number),
  CLIENTID: Schema.optional(Schema.Number),
  PROJECTID: Schema.optional(Schema.Number),
  PROJECT_START_DT: Schema.optional(Schema.String),
  PROJECT_END_DT: Schema.optional(Schema.String),
  START_DT: Schema.optional(Schema.String),
  END_DT: Schema.optional(Schema.String),
  STATE: Schema.optional(Schema.String),
});

export type GetTasksForUserResponse = Schema.Type<typeof GetTasksForUserResponse>;
export const GetTasksForUserResponse = Schema.Struct({ Records: Schema.Array(TaskForUserRaw) });

export class TaskForUser extends Schema.Class<TaskForUser>('TaskForUser')({
  id: Schema.Number,
  workload: Schema.optional(Schema.Number),
  total: Schema.optional(Schema.Number),
  remaining: Schema.optional(Schema.Number),
  avail: Schema.optional(Schema.Number),
  clientId: Schema.optional(Schema.Number),
  projectId: Schema.optional(Schema.Number),
  projectStartDate: Schema.optional(Schema.String),
  projectEndDate: Schema.optional(Schema.String),
  startDate: Schema.optional(Schema.String),
  endDate: Schema.optional(Schema.String),
  state: Schema.optional(Schema.String),
}) {}

export function taskForUserFromRaw(raw: TaskForUserRaw): Schema.Type<typeof TaskForUser> {
  return new TaskForUser({
    id: raw.ID,
    workload: raw.WORKLOAD,
    total: raw.TOTAL,
    remaining: raw.REMAINING,
    avail: raw.AVAIL,
    clientId: raw.CLIENTID,
    projectId: raw.PROJECTID,
    projectStartDate: raw.PROJECT_START_DT,
    projectEndDate: raw.PROJECT_END_DT,
    startDate: raw.START_DT,
    endDate: raw.END_DT,
    state: raw.STATE,
  });
}

export type TodoDetail = Schema.Type<typeof TodoDetail>;
export const TodoDetail = Schema.Record(Schema.String, Schema.Unknown);

type TodoSummaryRaw = Schema.Type<typeof TodoSummaryRaw>;
const TodoSummaryRaw = Schema.Struct({
  ID: Schema.Number,
  NAME: Schema.optional(Schema.String),
  BOARDLISTID: Schema.optional(Schema.Number),
  BOARDID: Schema.optional(Schema.Number),
  OWNERID: Schema.optional(Schema.Number),
  EXTID: Schema.optional(Schema.String),
  STATE: Schema.optional(Schema.NullOr(Schema.String)),
  DUE_DT: Schema.optional(Schema.NullOr(Schema.String)),
  DESCRIPTION: Schema.optional(Schema.NullOr(Schema.String)),
});

export type GetBoardTodosResponse = Schema.Type<typeof GetBoardTodosResponse>;
export const GetBoardTodosResponse = Schema.Struct({
  Records: Schema.Array(TodoSummaryRaw),
  RecordCount: Schema.optional(Schema.Number),
});

export class TodoSummary extends Schema.Class<TodoSummary>('TodoSummary')({
  id: Schema.Number,
  name: Schema.optional(Schema.String),
  boardListId: Schema.optional(Schema.Number),
  boardId: Schema.optional(Schema.Number),
  ownerId: Schema.optional(Schema.Number),
  extId: Schema.optional(Schema.String),
  state: Schema.optional(Schema.NullOr(Schema.String)),
  dueDate: Schema.optional(Schema.NullOr(Schema.String)),
  description: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

export function todoSummaryFromRaw(raw: TodoSummaryRaw): Schema.Type<typeof TodoSummary> {
  return new TodoSummary({
    id: raw.ID,
    name: raw.NAME,
    boardListId: raw.BOARDLISTID,
    boardId: raw.BOARDID,
    ownerId: raw.OWNERID,
    extId: raw.EXTID,
    state: raw.STATE,
    dueDate: raw.DUE_DT,
    description: raw.DESCRIPTION,
  });
}

export interface GetBoardTodosParams {
  readonly boardId: number;
  readonly boardListId?: number;
  readonly query?: string;
  readonly limit?: number;
}

export interface GetTasksParams {
  readonly projectId: number;
  readonly states?: ReadonlyArray<TaskState>;
  readonly limit?: number;
  readonly page?: number;
}

export interface GetProjectDetailsParams {
  readonly projectId: number;
}

export interface GetTasksForUserParams {
  readonly contactId: string;
  readonly startDate: Date;
  readonly period: number;
}

export interface GetTodoDetailParams {
  readonly id: number;
}

export interface MoveTodoParams {
  readonly id: number;
  readonly boardId: number;
  readonly boardListId: number;
  readonly sortIndex: number;
}

export interface PostMessageParams {
  readonly objectType: 'TODO' | 'BOARD' | 'PROJECT';
  readonly objectId: number;
  readonly content: string;
}

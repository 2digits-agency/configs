/* eslint-disable unicorn/no-null */
import * as Schema from 'effect/Schema';

/** Raw activity from TLO API response. Field names match the API exactly. */
export const ActivityRaw = Schema.Struct({
  ID: Schema.Number,
  FOLDERID: Schema.optional(Schema.Union(Schema.String, Schema.Number)),
  PROJECT_ID: Schema.optional(Schema.Union(Schema.String, Schema.Number)),
  TASKID: Schema.optional(Schema.NullOr(Schema.Union(Schema.String, Schema.Number))),
  TODOID: Schema.optional(Schema.NullOr(Schema.Union(Schema.String, Schema.Number))),
  TICKETID: Schema.optional(Schema.NullOr(Schema.Union(Schema.String, Schema.Number))),
  CONTACTID: Schema.optional(Schema.Union(Schema.String, Schema.Number)),
  DESCRIPTION: Schema.NullOr(Schema.String),
  DT: Schema.String,
  START_DT: Schema.optional(Schema.String),
  END_DT: Schema.optional(Schema.String),
  DURATION: Schema.Number,
  TYPE: Schema.optional(Schema.Number),
  PROJECT_NAME: Schema.optional(Schema.NullOr(Schema.String)),
  TASK_NAME: Schema.optional(Schema.NullOr(Schema.String)),
  CLIENT_NAME: Schema.optional(Schema.NullOr(Schema.String)),
  FOLDER_NAME: Schema.optional(Schema.NullOr(Schema.String)),
  ENTITY_NAME: Schema.optional(Schema.NullOr(Schema.String)),
  PROJECTOWNER_NAME: Schema.optional(Schema.NullOr(Schema.String)),
  CLIENT_COLOR: Schema.optional(Schema.NullOr(Schema.String)),
  PROJECT_COLOR: Schema.optional(Schema.NullOr(Schema.String)),
  PROJECT_STATE: Schema.optional(Schema.NullOr(Schema.String)),
  TASK_STATE: Schema.optional(Schema.NullOr(Schema.String)),
  TIMESHEET_STATE: Schema.optional(Schema.NullOr(Schema.String)),
  BILLING_MODE: Schema.optional(Schema.NullOr(Schema.String)),
  NON_BILLABLE: Schema.optional(Schema.NullOr(Schema.Number)),
  RATE: Schema.optional(Schema.NullOr(Schema.Number)),
  VALUE: Schema.optional(Schema.NullOr(Schema.Number)),
  PROJECT_START_DT: Schema.optional(Schema.NullOr(Schema.String)),
  PROJECT_END_DT: Schema.optional(Schema.NullOr(Schema.String)),
  TASK_START_DT: Schema.optional(Schema.NullOr(Schema.String)),
  TASK_END_DT: Schema.optional(Schema.NullOr(Schema.String)),
  READONLY: Schema.optional(Schema.NullOr(Schema.Number)),
  TASK_WORKLOAD: Schema.optional(Schema.NullOr(Schema.Number)),
});
export type ActivityRaw = typeof ActivityRaw.Type;

export class Activity extends Schema.Class<Activity>('Activity')({
  id: Schema.Number,
  projectId: Schema.optional(Schema.String),
  folderId: Schema.optional(Schema.String),
  taskId: Schema.optional(Schema.NullOr(Schema.String)),
  todoId: Schema.optional(Schema.NullOr(Schema.String)),
  ticketId: Schema.optional(Schema.NullOr(Schema.String)),
  userId: Schema.optional(Schema.String),
  description: Schema.NullOr(Schema.String),
  startDate: Schema.String,
  endDate: Schema.optional(Schema.String),
  durationMinutes: Schema.Number,
  projectName: Schema.optional(Schema.NullOr(Schema.String)),
  taskName: Schema.optional(Schema.NullOr(Schema.String)),
  clientName: Schema.optional(Schema.NullOr(Schema.String)),
  folderName: Schema.optional(Schema.NullOr(Schema.String)),
  entityName: Schema.optional(Schema.NullOr(Schema.String)),
  projectOwnerName: Schema.optional(Schema.NullOr(Schema.String)),
  projectState: Schema.optional(Schema.NullOr(Schema.String)),
  taskState: Schema.optional(Schema.NullOr(Schema.String)),
  timesheetState: Schema.optional(Schema.NullOr(Schema.String)),
  billingMode: Schema.optional(Schema.NullOr(Schema.String)),
  nonBillable: Schema.optional(Schema.NullOr(Schema.Number)),
  rate: Schema.optional(Schema.NullOr(Schema.Number)),
  value: Schema.optional(Schema.NullOr(Schema.Number)),
  projectStartDate: Schema.optional(Schema.NullOr(Schema.String)),
  projectEndDate: Schema.optional(Schema.NullOr(Schema.String)),
  taskStartDate: Schema.optional(Schema.NullOr(Schema.String)),
  taskEndDate: Schema.optional(Schema.NullOr(Schema.String)),
  readOnly: Schema.optional(Schema.NullOr(Schema.Boolean)),
  taskWorkload: Schema.optional(Schema.NullOr(Schema.Number)),
  projectColor: Schema.optional(Schema.String),
  clientColor: Schema.optional(Schema.String),
}) {}

export function activityFromRaw(raw: ActivityRaw): typeof Activity.Type {
  return new Activity({
    id: raw.ID,
    projectId:
      raw.PROJECT_ID === undefined
        ? raw.FOLDERID === undefined
          ? undefined
          : String(raw.FOLDERID)
        : String(raw.PROJECT_ID),
    folderId: raw.FOLDERID === undefined ? undefined : String(raw.FOLDERID),
    taskId: raw.TASKID !== undefined && raw.TASKID !== null ? String(raw.TASKID) : null,
    todoId: raw.TODOID !== undefined && raw.TODOID !== null ? String(raw.TODOID) : null,
    ticketId: raw.TICKETID !== undefined && raw.TICKETID !== null ? String(raw.TICKETID) : null,
    userId: raw.CONTACTID === undefined ? undefined : String(raw.CONTACTID),
    description: raw.DESCRIPTION,
    startDate: raw.DT,
    endDate: raw.END_DT,
    durationMinutes: raw.DURATION,
    projectName: raw.PROJECT_NAME,
    taskName: raw.TASK_NAME,
    clientName: raw.CLIENT_NAME,
    folderName: raw.FOLDER_NAME,
    entityName: raw.ENTITY_NAME,
    projectOwnerName: raw.PROJECTOWNER_NAME,
    projectState: raw.PROJECT_STATE,
    taskState: raw.TASK_STATE,
    timesheetState: raw.TIMESHEET_STATE,
    billingMode: raw.BILLING_MODE,
    nonBillable: raw.NON_BILLABLE,
    rate: raw.RATE,
    value: raw.VALUE,
    projectStartDate: raw.PROJECT_START_DT,
    projectEndDate: raw.PROJECT_END_DT,
    taskStartDate: raw.TASK_START_DT,
    taskEndDate: raw.TASK_END_DT,
    readOnly: raw.READONLY === undefined || raw.READONLY === null ? undefined : raw.READONLY !== 0,
    taskWorkload: raw.TASK_WORKLOAD,
    projectColor: raw.PROJECT_COLOR ?? undefined,
    clientColor: raw.CLIENT_COLOR ?? undefined,
  });
}

export const GetWeekResponse = Schema.Struct({
  ACTIVITIES: Schema.Array(ActivityRaw),
});
export type GetWeekResponse = typeof GetWeekResponse.Type;

export const SetActivityResponse = Schema.Struct({
  ID: Schema.Number,
  DURATION: Schema.optional(Schema.Number),
  DT: Schema.optional(Schema.String),
  TYPE: Schema.optional(Schema.Number),
  DESCRIPTION: Schema.optional(Schema.NullOr(Schema.String)),
  CLIENT_COLOR: Schema.optional(Schema.String),
  FOLDERID: Schema.optional(Schema.Union(Schema.String, Schema.Number)),
});
export type SetActivityResponse = typeof SetActivityResponse.Type;

export interface CreateActivityParams {
  readonly folderId: string;
  readonly taskId?: string;
  readonly todoId?: string;
  readonly startDate: Date;
  readonly durationMinutes: number;
  readonly description?: string;
  readonly contactId: string;
  readonly clientColor?: string;
}

export interface UpdateActivityParams {
  readonly id: number;
  readonly startDate?: Date;
  readonly durationMinutes?: number;
  readonly description?: string;
}

export interface DeleteActivityParams {
  readonly id: number;
}

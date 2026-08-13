/* eslint-disable unicorn/no-null */
import * as Schema from 'effect/Schema';

/**
 * Raw activity from TLO API response. Field names match the API exactly.
 */
export const ActivityRaw = Schema.Struct({
  ID: Schema.Finite,
  FOLDERID: Schema.optional(Schema.Union([Schema.String, Schema.Finite])),
  PROJECT_ID: Schema.optional(Schema.Union([Schema.String, Schema.Finite])),
  TASKID: Schema.Union([Schema.String, Schema.Finite]).pipe(Schema.NullOr, Schema.optional),
  TODOID: Schema.Union([Schema.String, Schema.Finite]).pipe(Schema.NullOr, Schema.optional),
  TICKETID: Schema.Union([Schema.String, Schema.Finite]).pipe(Schema.NullOr, Schema.optional),
  CONTACTID: Schema.optional(Schema.Union([Schema.String, Schema.Finite])),
  DESCRIPTION: Schema.NullOr(Schema.String),
  DT: Schema.String,
  START_DT: Schema.optional(Schema.String),
  END_DT: Schema.optional(Schema.String),
  DURATION: Schema.Finite,
  TYPE: Schema.optional(Schema.Finite),
  PROJECT_NAME: Schema.String.pipe(Schema.NullOr, Schema.optional),
  TASK_NAME: Schema.String.pipe(Schema.NullOr, Schema.optional),
  CLIENT_NAME: Schema.String.pipe(Schema.NullOr, Schema.optional),
  FOLDER_NAME: Schema.String.pipe(Schema.NullOr, Schema.optional),
  ENTITY_NAME: Schema.String.pipe(Schema.NullOr, Schema.optional),
  PROJECTOWNER_NAME: Schema.String.pipe(Schema.NullOr, Schema.optional),
  CLIENT_COLOR: Schema.String.pipe(Schema.NullOr, Schema.optional),
  PROJECT_COLOR: Schema.String.pipe(Schema.NullOr, Schema.optional),
  PROJECT_STATE: Schema.String.pipe(Schema.NullOr, Schema.optional),
  TASK_STATE: Schema.String.pipe(Schema.NullOr, Schema.optional),
  TIMESHEET_STATE: Schema.String.pipe(Schema.NullOr, Schema.optional),
  BILLING_MODE: Schema.String.pipe(Schema.NullOr, Schema.optional),
  NON_BILLABLE: Schema.Finite.pipe(Schema.NullOr, Schema.optional),
  RATE: Schema.Finite.pipe(Schema.NullOr, Schema.optional),
  VALUE: Schema.Finite.pipe(Schema.NullOr, Schema.optional),
  PROJECT_START_DT: Schema.String.pipe(Schema.NullOr, Schema.optional),
  PROJECT_END_DT: Schema.String.pipe(Schema.NullOr, Schema.optional),
  TASK_START_DT: Schema.String.pipe(Schema.NullOr, Schema.optional),
  TASK_END_DT: Schema.String.pipe(Schema.NullOr, Schema.optional),
  READONLY: Schema.Finite.pipe(Schema.NullOr, Schema.optional),
  TASK_WORKLOAD: Schema.Finite.pipe(Schema.NullOr, Schema.optional),
});
export type ActivityRaw = typeof ActivityRaw.Type;

export class Activity extends Schema.Class<Activity>('Activity')({
  id: Schema.Finite,
  projectId: Schema.optional(Schema.String),
  folderId: Schema.optional(Schema.String),
  taskId: Schema.String.pipe(Schema.NullOr, Schema.optional),
  todoId: Schema.String.pipe(Schema.NullOr, Schema.optional),
  ticketId: Schema.String.pipe(Schema.NullOr, Schema.optional),
  userId: Schema.optional(Schema.String),
  description: Schema.NullOr(Schema.String),
  startDate: Schema.String,
  endDate: Schema.optional(Schema.String),
  durationMinutes: Schema.Finite,
  projectName: Schema.String.pipe(Schema.NullOr, Schema.optional),
  taskName: Schema.String.pipe(Schema.NullOr, Schema.optional),
  clientName: Schema.String.pipe(Schema.NullOr, Schema.optional),
  folderName: Schema.String.pipe(Schema.NullOr, Schema.optional),
  entityName: Schema.String.pipe(Schema.NullOr, Schema.optional),
  projectOwnerName: Schema.String.pipe(Schema.NullOr, Schema.optional),
  projectState: Schema.String.pipe(Schema.NullOr, Schema.optional),
  taskState: Schema.String.pipe(Schema.NullOr, Schema.optional),
  timesheetState: Schema.String.pipe(Schema.NullOr, Schema.optional),
  billingMode: Schema.String.pipe(Schema.NullOr, Schema.optional),
  nonBillable: Schema.Finite.pipe(Schema.NullOr, Schema.optional),
  rate: Schema.Finite.pipe(Schema.NullOr, Schema.optional),
  value: Schema.Finite.pipe(Schema.NullOr, Schema.optional),
  projectStartDate: Schema.String.pipe(Schema.NullOr, Schema.optional),
  projectEndDate: Schema.String.pipe(Schema.NullOr, Schema.optional),
  taskStartDate: Schema.String.pipe(Schema.NullOr, Schema.optional),
  taskEndDate: Schema.String.pipe(Schema.NullOr, Schema.optional),
  readOnly: Schema.Boolean.pipe(Schema.NullOr, Schema.optional),
  taskWorkload: Schema.Finite.pipe(Schema.NullOr, Schema.optional),
  projectColor: Schema.optional(Schema.String),
  clientColor: Schema.optional(Schema.String),
}) {}

export function activityFromRaw(raw: ActivityRaw): Activity {
  return Activity.make({
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
  ID: Schema.Finite,
  DURATION: Schema.optional(Schema.Finite),
  DT: Schema.optional(Schema.String),
  TYPE: Schema.optional(Schema.Finite),
  DESCRIPTION: Schema.String.pipe(Schema.NullOr, Schema.optional),
  CLIENT_COLOR: Schema.optional(Schema.String),
  FOLDERID: Schema.optional(Schema.Union([Schema.String, Schema.Finite])),
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

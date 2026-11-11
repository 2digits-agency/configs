import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';
import * as SchemaGetter from 'effect/SchemaGetter';

import { ApiId, CommaList, NullAs } from './text.js';

export class ProjectTaskAdded extends Schema.Class<ProjectTaskAdded, { readonly brand: unique symbol }>(
  'ProjectTaskAdded',
)({
  taskId: ApiId.annotate({ description: 'api_id of the new task, for CreateTimeEntry or StartTimer' }).pipe(
    Schema.optionalKey,
  ),
  projectId: ApiId.annotate({ description: 'api_id of the project' }).pipe(Schema.optionalKey),
  message: Schema.String.annotate({ description: "Orbit's confirmation, with the rate card and assignees it applied" }),
}) {}

/*
 * The task exists once Orbit answers, so an unexpected confirmation still decodes: failing here would invite a retry
 * that adds the task twice.
 */
const Confirmation = Schema.String.pipe(
  Schema.decodeTo(ProjectTaskAdded, {
    decode: SchemaGetter.transform((message) => {
      const taskId = /\bapi_id: (?<id>[A-Z0-9]{15})\b/.exec(message)?.groups?.id;

      const projectId = /\bproject \(api_id (?<id>[A-Z0-9]{15})\)/.exec(message)?.groups?.id;

      return {
        message,
        ...(P.isUndefined(taskId) ? {} : { taskId }),
        ...(P.isUndefined(projectId) ? {} : { projectId }),
      };
    }),
    encode: SchemaGetter.forbiddenEncoding,
  }),
);

/**
 * Orbit's own arguments, as `tools/list` describes them, decoded to the gateway's names and values: dates as
 * `startDate`/`endDate`, `assignees` as a list and `null` for no retainer (Orbit's `NONE`).
 */
export const AddProjectTask = {
  name: 'AddProjectTask',
  args: Schema.Struct({
    projectId: Schema.String,
    name: Schema.String,
    description: Schema.String.pipe(Schema.optionalKey),
    workloadHours: Schema.Finite.pipe(Schema.optionalKey),
    startDate: Schema.String.pipe(Schema.optionalKey),
    endDate: Schema.String.pipe(Schema.optionalKey),
    assignees: CommaList.pipe(Schema.optionalKey),
    chapterId: Schema.String.pipe(Schema.optionalKey),
    rateId: Schema.String.pipe(Schema.optionalKey),
    rate: Schema.Finite.pipe(Schema.optionalKey),
    nonBillable: Schema.Boolean.pipe(Schema.optionalKey),
    recurring: Schema.Boolean.pipe(Schema.optionalKey),
    billingMode: Schema.String.pipe(Schema.optionalKey),
    retainerId: NullAs('NONE').pipe(Schema.optionalKey),
  }).pipe(Schema.encodeKeys({ startDate: 'startDt', endDate: 'endDt', assignees: 'assignedTo' })),
  result: Confirmation,
};

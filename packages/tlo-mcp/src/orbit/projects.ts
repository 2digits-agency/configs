import * as Arr from 'effect/Array';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';
import * as SchemaGetter from 'effect/SchemaGetter';
import * as Str from 'effect/String';

import { ProjectTaskId } from './text.js';

export const CloseProjectTask = {
  name: 'CloseProjectTask',
  args: Schema.Struct({ taskId: ProjectTaskId, force: Schema.Boolean.pipe(Schema.optionalKey) }),
  result: Schema.String,
};

/**
 * A field Orbit clears or unlinks with `sentinel` (an empty string, `0` or `NONE`), as `null`.
 *
 * @param sentinel
 */
function NullAs(sentinel: string) {
  return Schema.String.pipe(
    Schema.decodeTo(Schema.String.pipe(Schema.NullOr), {
      // eslint-disable-next-line unicorn/no-null -- the gateway's value for a cleared field
      decode: SchemaGetter.transform((value) => (value === sentinel ? null : value)),
      encode: SchemaGetter.transform((value) => value ?? sentinel),
    }),
  );
}

// Orbit's 0/1 flags.
const Flag = Schema.Literals([0, 1]).pipe(
  Schema.decodeTo(Schema.Boolean, {
    decode: SchemaGetter.transform((flag) => flag === 1),
    encode: SchemaGetter.transform((flag) => (flag ? 1 : 0)),
  }),
);

// Orbit's comma-separated list, where an empty string clears it.
const CommaList = Schema.String.pipe(
  Schema.decodeTo(Schema.NonEmptyArray(Schema.String).pipe(Schema.NullOr), {
    // eslint-disable-next-line unicorn/no-null -- the gateway's value for a cleared list
    decode: SchemaGetter.transform((list) => (list === '' ? null : Str.split(list, ','))),
    encode: SchemaGetter.transform((list) => (P.isNull(list) ? '' : Arr.join(list, ','))),
  }),
);

/**
 * The header fields `UpdateProject` changes, sent as the JSON string `fieldsJson` with Orbit's upper-case keys.
 */
const ProjectFields = Schema.Struct({
  name: Schema.String.pipe(Schema.optionalKey),
  description: Schema.String.pipe(Schema.optionalKey),
  purchaseOrder: Schema.String.pipe(Schema.optionalKey),
  startDate: Schema.String.pipe(Schema.optionalKey),
  endDate: NullAs('').pipe(Schema.optionalKey),
  fixedPrice: Schema.Finite.pipe(Schema.optionalKey),
  ownerId: NullAs('').pipe(Schema.optionalKey),
  folderId: Schema.String.pipe(Schema.optionalKey),
  dealId: NullAs('0').pipe(Schema.optionalKey),
  analyticalCategoryId: NullAs('').pipe(Schema.optionalKey),
}).pipe(
  Schema.encodeKeys({
    name: 'NAME',
    description: 'DESCRIPTION',
    purchaseOrder: 'PO',
    startDate: 'START_DT',
    endDate: 'END_DT',
    fixedPrice: 'BILLING_BUDGET',
    ownerId: 'OWNERID',
    folderId: 'FOLDERID',
    dealId: 'DEALID',
    analyticalCategoryId: 'ACATID',
  }),
);

export const UpdateProject = {
  name: 'UpdateProject',
  args: Schema.Struct({ projectId: Schema.String, fieldsJson: ProjectFields.pipe(Schema.fromJsonString) }),
  result: Schema.String,
};

/**
 * The task fields `UpdateProjectTask` changes, sent like `ProjectFields`.
 */
const ProjectTaskFields = Schema.Struct({
  name: Schema.String.pipe(Schema.optionalKey),
  description: Schema.String.pipe(Schema.optionalKey),
  workloadHours: Schema.Finite.pipe(Schema.optionalKey),
  rateId: Schema.String.pipe(Schema.optionalKey),
  rate: Schema.Finite.pipe(Schema.optionalKey),
  startDate: Schema.String.pipe(Schema.optionalKey),
  endDate: NullAs('').pipe(Schema.optionalKey),
  recurring: Flag.pipe(Schema.optionalKey),
  billingMode: Schema.String.pipe(Schema.optionalKey),
  assignees: CommaList.pipe(Schema.optionalKey),
  retainerId: NullAs('NONE').pipe(Schema.optionalKey),
  analyticalCategoryId: NullAs('').pipe(Schema.optionalKey),
}).pipe(
  Schema.encodeKeys({
    name: 'NAME',
    description: 'DESCRIPTION',
    workloadHours: 'WORKLOAD',
    rateId: 'RATEID',
    rate: 'RATE',
    startDate: 'START_DT',
    endDate: 'END_DT',
    recurring: 'RECURRING',
    billingMode: 'BILLING_MODE',
    assignees: 'ASSIGNEDTO',
    retainerId: 'RETAINERID',
    analyticalCategoryId: 'ACATID',
  }),
);

export const UpdateProjectTask = {
  name: 'UpdateProjectTask',
  args: Schema.Struct({ taskId: ProjectTaskId, fieldsJson: ProjectTaskFields.pipe(Schema.fromJsonString) }),
  result: Schema.String,
};

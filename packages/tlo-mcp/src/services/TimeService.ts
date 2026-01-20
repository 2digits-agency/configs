import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import type { TloError } from '../schemas/errors.js';
import {
  activityFromRaw,
  GetWeekResponse,
  SetActivityResponse,
  type Activity,
  type CreateActivityParams,
  type DeleteActivityParams,
  type UpdateActivityParams,
} from '../schemas/time.js';
import { TeamLeaderClient } from './TeamLeaderClient.js';

function formatRequestDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  const second = String(d.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

export interface TimeServiceShape {
  readonly getWeek: (
    date: Date,
    contactId: string,
    timezone?: string,
  ) => Effect.Effect<ReadonlyArray<typeof Activity.Type>, TloError>;

  readonly createActivity: (params: CreateActivityParams) => Effect.Effect<number, TloError>;

  readonly updateActivity: (params: UpdateActivityParams) => Effect.Effect<void, TloError>;

  readonly deleteActivity: (params: DeleteActivityParams) => Effect.Effect<void, TloError>;
}

export class TimeService extends Context.Tag('@2digits/tlo-mcp/services/TimeService')<
  TimeService,
  TimeServiceShape
>() {}

export const TimeServiceLive = Layer.effect(
  TimeService,
  Effect.gen(function* () {
    const client = yield* TeamLeaderClient;

    return TimeService.of({
      getWeek: Effect.fn('TimeService.getWeek')(function* (date, contactId, timezone = 'Europe/Amsterdam') {
        return yield* client
          .post(
            '/ajax/pln/GetWeek',
            { DT: formatRequestDate(date), CONTACTID: contactId, tmz: timezone },
            GetWeekResponse,
          )
          .pipe(Effect.map((response) => response.ACTIVITIES.map((raw) => activityFromRaw(raw))));
      }),

      createActivity: Effect.fn('TimeService.createActivity')(function* (params) {
        return yield* client
          .post(
            '/ajax/pln/SetActivity',
            {
              ID: 0,
              ACTION: 'CREATE',
              DT: formatRequestDate(params.startDate),
              DURATION: params.durationMinutes,
              FOLDERID: params.folderId,
              TASKID: params.taskId,
              TODOID: params.todoId,
              CONTACTID: params.contactId,
              CLIENT_COLOR: params.clientColor,
              DESCRIPTION: params.description,
            },
            SetActivityResponse,
          )
          .pipe(Effect.map((response) => response.ID));
      }),

      updateActivity: Effect.fn('TimeService.updateActivity')(function* (params) {
        return yield* client
          .post(
            '/ajax/pln/SetActivity',
            {
              ID: params.id,
              ACTION: 'MOVE',
              DT: params.startDate ? formatRequestDate(params.startDate) : undefined,
              DURATION: params.durationMinutes,
              DESCRIPTION: params.description,
            },
            SetActivityResponse,
          )
          .pipe(Effect.asVoid);
      }),

      deleteActivity: Effect.fn('TimeService.deleteActivity')(function* (params) {
        return yield* client
          .post('/ajax/pln/SetActivity', { ID: params.id, ACTION: 'DELETE' }, SetActivityResponse)
          .pipe(Effect.asVoid);
      }),
    });
  }),
);

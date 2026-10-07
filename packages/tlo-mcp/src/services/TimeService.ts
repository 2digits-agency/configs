import * as Arr from 'effect/Array';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { TloParseError, type TloError } from '../schemas/errors.js';
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

export interface TimeServiceShape {
  readonly getWeek: (
    date: Date,
    contactId: string,
    timezone?: string,
  ) => Effect.Effect<ReadonlyArray<Activity>, TloError>;

  readonly createActivity: (params: CreateActivityParams) => Effect.Effect<number, TloError>;

  readonly updateActivity: (params: UpdateActivityParams) => Effect.Effect<void, TloError>;

  readonly deleteActivity: (params: DeleteActivityParams) => Effect.Effect<void, TloError>;
}

export class TimeService extends Context.Service<TimeService, TimeServiceShape>()(
  '@2digits/tlo-mcp/services/TimeService',
) {}

export const TimeServiceLive = Layer.effect(
  TimeService,
  Effect.gen(function* () {
    const client = yield* TeamLeaderClient;

    return TimeService.of({
      getWeek: Effect.fn('TimeService.getWeek')(function* (
        date: Date,
        contactId: string,
        timezone = 'Europe/Amsterdam',
      ) {
        const timeZone = yield* DateTime.zoneMakeNamedEffect(timezone).pipe(
          Effect.mapError((cause) => TloParseError.make({ message: `Invalid timezone: ${timezone}`, cause })),
        );

        const response = yield* client.post(
          '/ajax/pln/GetWeek',
          {
            DT: DateTime.makeZonedUnsafe(date, { timeZone }).pipe(DateTime.formatIsoOffset).slice(0, 19),
            CONTACTID: contactId,
            tmz: timezone,
          },
          GetWeekResponse,
        );

        return Arr.map(activityFromRaw)(response.ACTIVITIES);
      }),

      createActivity: Effect.fn('TimeService.createActivity')(function* (params: CreateActivityParams) {
        const response = yield* client.post(
          '/ajax/pln/SetActivity',
          {
            ID: 0,
            ACTION: 'CREATE',
            // Preserve local-time writes until the account timezone contract is established.
            DT: DateTime.makeZonedUnsafe(params.startDate, { timeZone: DateTime.zoneMakeLocal() })
              .pipe(DateTime.formatIsoOffset)
              .slice(0, 19),
            DURATION: params.durationMinutes,
            FOLDERID: params.folderId,
            TASKID: params.taskId,
            TODOID: params.todoId,
            CONTACTID: params.contactId,
            CLIENT_COLOR: params.clientColor,
            DESCRIPTION: params.description,
          },
          SetActivityResponse,
        );

        return response.ID;
      }),

      updateActivity: Effect.fn('TimeService.updateActivity')(function* (params: UpdateActivityParams) {
        yield* client.post(
          '/ajax/pln/SetActivity',
          {
            ID: params.id,
            ACTION: 'MOVE',
            DT:
              params.startDate === undefined
                ? undefined
                : DateTime.makeZonedUnsafe(params.startDate, { timeZone: DateTime.zoneMakeLocal() })
                    .pipe(DateTime.formatIsoOffset)
                    .slice(0, 19),
            DURATION: params.durationMinutes,
            DESCRIPTION: params.description,
          },
          SetActivityResponse,
        );
      }),

      deleteActivity: Effect.fn('TimeService.deleteActivity')(function* (params: DeleteActivityParams) {
        yield* client.post('/ajax/pln/SetActivity', { ID: params.id, ACTION: 'DELETE' }, SetActivityResponse);
      }),
    });
  }),
);

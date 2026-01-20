import { describe, expect, layer } from '@effect/vitest';
import { Effect, Layer } from 'effect';

import type { GetWeekResponse, SetActivityResponse } from '../src/schemas/time.js';
import { TeamLeaderClient } from '../src/services/TeamLeaderClient.js';
import { TimeService, TimeServiceLive } from '../src/services/TimeService.js';

const mockActivitiesRaw: typeof GetWeekResponse.Type = {
  ACTIVITIES: [
    {
      ID: 1,
      DT: '20250115090000',
      DURATION: 60,
      FOLDERID: '100',
      TASKID: '200',
      TODOID: '300',
      TICKETID: undefined,
      CONTACTID: 'user1',
      CLIENT_COLOR: '#FF0000',
      DESCRIPTION: 'Morning work',
    },
  ],
};

const mockSetActivityResponse: typeof SetActivityResponse.Type = {
  ID: 999,
  DURATION: 30,
  DT: '20250115100000',
};

function createMockClient(response: unknown) {
  return Layer.succeed(
    TeamLeaderClient,
    TeamLeaderClient.of({
      post: () => Effect.succeed(response) as never,
    }),
  );
}

describe('TimeService', () => {
  describe('getWeek', () => {
    const TestLayer = TimeServiceLive.pipe(Layer.provide(createMockClient(mockActivitiesRaw)));

    layer(TestLayer)((it) => {
      it.effect('returns transformed activities', () =>
        Effect.gen(function* () {
          const service = yield* TimeService;
          const activities = yield* service.getWeek(new Date('2025-01-15'), 'user1');

          expect(activities).toHaveLength(1);
          expect(activities[0]?.id).toBe(1);
          expect(activities[0]?.description).toBe('Morning work');
          expect(activities[0]?.durationMinutes).toBe(60);
        }),
      );
    });
  });

  describe('createActivity', () => {
    const TestLayer = TimeServiceLive.pipe(Layer.provide(createMockClient(mockSetActivityResponse)));

    layer(TestLayer)((it) => {
      it.effect('returns created activity ID', () =>
        Effect.gen(function* () {
          const service = yield* TimeService;
          const id = yield* service.createActivity({
            startDate: new Date('2025-01-15T10:00:00'),
            durationMinutes: 30,
            folderId: '100',
            taskId: '200',
            todoId: '300',
            contactId: 'user1',
            clientColor: '#00FF00',
            description: 'New activity',
          });

          expect(id).toBe(999);
        }),
      );
    });
  });

  describe('updateActivity', () => {
    const TestLayer = TimeServiceLive.pipe(Layer.provide(createMockClient(mockSetActivityResponse)));

    layer(TestLayer)((it) => {
      it.effect('completes without error', () =>
        Effect.gen(function* () {
          const service = yield* TimeService;

          yield* service.updateActivity({
            id: 1,
            durationMinutes: 45,
            description: 'Updated',
          });

          expect(true).toBe(true);
        }),
      );
    });
  });

  describe('deleteActivity', () => {
    const TestLayer = TimeServiceLive.pipe(Layer.provide(createMockClient(mockSetActivityResponse)));

    layer(TestLayer)((it) => {
      it.effect('completes without error', () =>
        Effect.gen(function* () {
          const service = yield* TimeService;

          yield* service.deleteActivity({ id: 1 });

          expect(true).toBe(true);
        }),
      );
    });
  });
});

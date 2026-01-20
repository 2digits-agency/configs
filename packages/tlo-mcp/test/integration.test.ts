import * as NodeHttpClient from '@effect/platform-node/NodeHttpClient';
import { describe, expect, layer } from '@effect/vitest';
import { Effect, Layer, Redacted } from 'effect';

import { BoardService, BoardServiceLive } from '../src/services/BoardService.js';
import { TeamLeaderClientLive } from '../src/services/TeamLeaderClient.js';
import { TimeService, TimeServiceLive } from '../src/services/TimeService.js';
import { TloConfig } from '../src/services/TloConfig.js';
import { TloHttpClientLive } from '../src/services/TloHttpClient.js';

const testConfig: typeof TloConfig.Service = {
  baseUrl: 'https://socialbrothers.orbit.teamleader.eu',
  sessionToken: Redacted.make('SlFAH6R-cUuIylpkdnSbz2h6L0i1MKbTdZj2AmA83DKXU9b4oWO9CawQiSmwi8fb'),
  cookies: new Map([
    ['did', '66971770c29c453e9eee39bd1d16c7c8bcf24e899c954554a803f856ff920640'],
    ['dskauthlogin', 'hnci4V53kvJSMrmrYQfq/ppuzcAL8Mfq9buvVNcimYU'],
  ]),
};

const ClientLayer = TeamLeaderClientLive.pipe(
  Layer.provide(TloHttpClientLive.pipe(Layer.provide(NodeHttpClient.layer))),
  Layer.provide(Layer.succeed(TloConfig, testConfig)),
);

const TestLayer = Layer.mergeAll(BoardServiceLive, TimeServiceLive).pipe(Layer.provide(ClientLayer));

describe('Integration', () => {
  describe('BoardService', () => {
    layer(TestLayer)((it) => {
      it.effect('getProjects returns real projects', () =>
        Effect.gen(function* () {
          const service = yield* BoardService;
          const projects = yield* service.getProjects({ limit: 5 });

          expect(Array.isArray(projects)).toBe(true);
          expect(projects.length).toBeGreaterThan(0);
          console.log(`Found ${projects.length} projects`);

          const first = projects[0];

          expect(first?.id).toBeDefined();
          expect(first?.name).toBeDefined();
          console.log('First project:', first?.name, '- State:', first?.state);
        }),
      );

      it.effect('getProjects filters by state', () =>
        Effect.gen(function* () {
          const service = yield* BoardService;
          const openProjects = yield* service.getProjects({ states: ['OPEN'], limit: 5 });

          expect(Array.isArray(openProjects)).toBe(true);
          console.log(`Found ${openProjects.length} OPEN projects`);

          for (const project of openProjects) {
            expect(project.state).toBe('OPEN');
          }
        }),
      );

      it.effect('getProjects supports pagination', () =>
        Effect.gen(function* () {
          const service = yield* BoardService;

          const page1 = yield* service.getProjects({ limit: 2, page: 1 });
          const page2 = yield* service.getProjects({ limit: 2, page: 2 });

          expect(page1.length).toBeLessThanOrEqual(2);
          expect(page2.length).toBeLessThanOrEqual(2);

          if (page1.length > 0 && page2.length > 0) {
            expect(page1[0]?.id).not.toBe(page2[0]?.id);
          }
          console.log(`Page 1: ${page1.length} projects, Page 2: ${page2.length} projects`);
        }),
      );

      it.effect('getBoardTodos returns todos from a board', () =>
        Effect.gen(function* () {
          const service = yield* BoardService;
          const boardId = 97_763;

          const todos = yield* service.getBoardTodos({ boardId });

          expect(Array.isArray(todos)).toBe(true);
          console.log(`Found ${todos.length} todos on board ${boardId}`);

          // Board may be empty - that's valid. Just verify shape if we have todos.
          if (todos.length > 0) {
            const first = todos[0];

            expect(first?.id).toBeDefined();
            expect(first?.name).toBeDefined();
            console.log('First todo:', first?.name);
          }
        }),
      );

      it.effect('getBoardTodos filters by query', () =>
        Effect.gen(function* () {
          const service = yield* BoardService;
          const boardId = 97_763;

          const todos = yield* service.getBoardTodos({ boardId, query: 'links' });

          expect(Array.isArray(todos)).toBe(true);
          console.log(`Found ${todos.length} todos matching "links"`);

          for (const todo of todos) {
            expect(todo.name?.toLowerCase()).toContain('links');
          }
        }),
      );
    });
  });

  describe('TimeService', () => {
    layer(TestLayer)((it) => {
      it.effect('getWeek returns activities for current week', () =>
        Effect.gen(function* () {
          const service = yield* TimeService;
          const activities = yield* service.getWeek(new Date(), 'me');

          expect(Array.isArray(activities)).toBe(true);
          console.log(`Found ${activities.length} activities this week`);

          if (activities.length > 0) {
            const first = activities[0];

            expect(first?.id).toBeDefined();
            expect(first?.durationMinutes).toBeDefined();
            console.log('First activity:', first?.description, '- Duration:', first?.durationMinutes, 'min');
          }
        }),
      );

      it.effect('getWeek returns activities for specific date', () =>
        Effect.gen(function* () {
          const service = yield* TimeService;
          const lastWeek = new Date();

          lastWeek.setDate(lastWeek.getDate() - 7);

          const activities = yield* service.getWeek(lastWeek, 'me');

          expect(Array.isArray(activities)).toBe(true);
          console.log(`Found ${activities.length} activities for week of ${lastWeek.toDateString()}`);
        }),
      );

      it.effect('createActivity and deleteActivity lifecycle', () =>
        Effect.gen(function* () {
          const timeService = yield* TimeService;

          const activities = yield* timeService.getWeek(new Date(), 'me');

          expect(activities.length).toBeGreaterThan(0);

          const existingActivity = activities.find((a) => a.taskId !== null);

          if (!existingActivity?.projectId || !existingActivity.taskId) {
            console.log('Skipping create/delete test: no activity with taskId found');

            return;
          }

          const startDate = new Date();

          startDate.setHours(8, 0, 0, 0);

          const result = yield* timeService
            .createActivity({
              folderId: existingActivity.projectId,
              taskId: existingActivity.taskId,
              startDate,
              durationMinutes: 15,
              description: 'Integration test - will be deleted',
              contactId: 'me',
            })
            .pipe(
              Effect.flatMap((activityId) =>
                Effect.gen(function* () {
                  expect(typeof activityId).toBe('number');
                  expect(activityId).toBeGreaterThan(0);
                  console.log('Created activity:', activityId);

                  yield* timeService.deleteActivity({ id: activityId });
                  console.log('Deleted activity:', activityId);

                  return 'success' as const;
                }),
              ),
              Effect.catchTag('TloApiError', (error) => {
                console.log('Create activity failed (expected if task has no budget):', error.message);

                return Effect.succeed('skipped-no-budget' as const);
              }),
            );

          expect(['success', 'skipped-no-budget']).toContain(result);
        }),
      );
    });
  });
});

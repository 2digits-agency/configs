import { describe, expect, layer } from '@effect/vitest';
import { Effect, Layer } from 'effect';

import type { GetMessagesResponse, GetProjectsResponse } from '../src/schemas/board.js';
import { BoardService, BoardServiceLive } from '../src/services/BoardService.js';
import { TeamLeaderClient } from '../src/services/TeamLeaderClient.js';

const mockProjectsRaw: typeof GetProjectsResponse.Type = {
  Records: [
    {
      ID: 123,
      PROJECT_NAME: 'Test Project',
      NAME: 'Test',
      STATE: 'OPEN',
      OWNER_NAME: 'Owner',
      START_DT: '20250101120000',
      END_DT: '20250201120000',
      BILLING_BUDGET: 1000,
      CLIENT_NAME: 'Client',
      CLIENT_ID: 456,
    },
  ],
};

const mockMessagesRaw: typeof GetMessagesResponse.Type = [
  {
    ID: 1,
    OWNERID: 789,
    OWNER_NAME: 'John Doe',
    CREATED_DT: '20250115100000',
    CONTENT: 'Test message',
    OBJECTTYPE: 'PROJECT',
    OBJECTID: 123,
    OBJECTNAME: 'Test Project',
    MSGTYPE: 'COMMENT',
    INTERNAL: 0,
  },
];

function createMockClient(response: unknown) {
  return Layer.succeed(
    TeamLeaderClient,
    TeamLeaderClient.of({
      post: () => Effect.succeed(response) as never,
    }),
  );
}

describe('BoardService', () => {
  describe('getProjects', () => {
    const TestLayer = BoardServiceLive.pipe(Layer.provide(createMockClient(mockProjectsRaw)));

    layer(TestLayer)((it) => {
      it.effect('returns transformed projects', () =>
        Effect.gen(function* () {
          const service = yield* BoardService;
          const projects = yield* service.getProjects();

          expect(projects).toHaveLength(1);
          expect(projects[0]?.id).toBe(123);
          expect(projects[0]?.name).toBe('Test Project');
          expect(projects[0]?.state).toBe('OPEN');
        }),
      );

      it.effect('returns projects with filter params', () =>
        Effect.gen(function* () {
          const service = yield* BoardService;
          const projects = yield* service.getProjects({ limit: 50, page: 2, states: ['OPEN'] });

          expect(projects).toHaveLength(1);
        }),
      );
    });
  });

  describe('getMessages', () => {
    const TestLayer = BoardServiceLive.pipe(Layer.provide(createMockClient(mockMessagesRaw)));

    layer(TestLayer)((it) => {
      it.effect('returns transformed messages', () =>
        Effect.gen(function* () {
          const service = yield* BoardService;
          const messages = yield* service.getMessages({
            objectType: 'PROJECT',
            objectId: 123,
          });

          expect(messages).toHaveLength(1);
          expect(messages[0]?.content).toBe('Test message');
          expect(messages[0]?.ownerName).toBe('John Doe');
        }),
      );
    });
  });

  describe('setTaskState', () => {
    const TestLayer = BoardServiceLive.pipe(Layer.provide(createMockClient({})));

    layer(TestLayer)((it) => {
      it.effect('completes without error', () =>
        Effect.gen(function* () {
          const service = yield* BoardService;

          yield* service.setTaskState({
            projectId: 123,
            taskId: 456,
            state: 'COMPLETED',
          });

          expect(true).toBe(true);
        }),
      );
    });
  });
});

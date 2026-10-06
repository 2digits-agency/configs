import { describe, expect, it } from '@effect/vitest';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';
import * as Schema from 'effect/Schema';

import { TloParseError } from '../src/schemas/errors.js';
import { TeamLeaderClient } from '../src/services/TeamLeaderClient.js';
import { TimeService, TimeServiceLive } from '../src/services/TimeService.js';

interface Request {
  readonly path: string;
  readonly body: unknown;
}

const withClient = Effect.fn('TimeServiceTimezoneTest.withClient')(function* <TResult, TError>(
  test: (requests: Ref.Ref<Array<Request>>) => Effect.Effect<TResult, TError, TimeService>,
) {
  const requests = yield* Ref.make<Array<Request>>([]);

  const client = Layer.succeed(
    TeamLeaderClient,
    TeamLeaderClient.of({
      post: Effect.fn('TimeServiceTimezoneTest.post')(function* (path, body, schema) {
        yield* Ref.update(requests, (current) => [...current, { path, body }]);

        const response: unknown =
          path === '/ajax/pln/GetWeek' ? { ACTIVITIES: [] } : { ID: 1, DURATION: 30, DT: '20250115100000' };

        return yield* Schema.decodeUnknownEffect(schema)(response).pipe(
          Effect.mapError((cause) => TloParseError.make({ message: 'Invalid mock response', cause })),
        );
      }),
    }),
  );

  return yield* test(requests).pipe(Effect.provide(TimeServiceLive.pipe(Layer.provide(client))));
});

describe('timeService timezone serialization', () => {
  const amsterdam = 'Europe/Amsterdam';

  const cases = [
    { instant: '2025-01-05T23:30:45Z', timezone: undefined, dt: '2025-01-06T00:30:45', tmz: amsterdam },
    { instant: '2025-07-06T22:30:45Z', timezone: undefined, dt: '2025-07-07T00:30:45', tmz: amsterdam },
    {
      instant: '2025-01-06T00:30:45Z',
      timezone: 'America/New_York',
      dt: '2025-01-05T19:30:45',
      tmz: 'America/New_York',
    },
    { instant: '2025-07-07T00:30:45Z', timezone: 'UTC', dt: '2025-07-07T00:30:45', tmz: 'UTC' },
    { instant: '2025-03-30T00:30:45Z', timezone: undefined, dt: '2025-03-30T01:30:45', tmz: amsterdam },
    { instant: '2025-03-30T01:30:45Z', timezone: undefined, dt: '2025-03-30T03:30:45', tmz: amsterdam },
    { instant: '2025-10-26T00:30:45Z', timezone: undefined, dt: '2025-10-26T02:30:45', tmz: amsterdam },
    { instant: '2025-10-26T01:30:45Z', timezone: undefined, dt: '2025-10-26T02:30:45', tmz: amsterdam },
  ];

  for (const { instant, timezone, dt, tmz } of cases) {
    it.effect(`formats ${instant} in ${tmz}`, () =>
      withClient((requests) =>
        Effect.gen(function* () {
          const service = yield* TimeService;

          yield* service.getWeek(DateTime.makeUnsafe(instant).pipe(DateTime.toDateUtc), 'contact-1', timezone);

          expect(yield* Ref.get(requests)).toStrictEqual([
            { path: '/ajax/pln/GetWeek', body: { DT: dt, CONTACTID: 'contact-1', tmz } },
          ]);
        }),
      ),
    );
  }

  it.effect('rejects invalid timezones without posting', () =>
    withClient((requests) =>
      Effect.gen(function* () {
        const service = yield* TimeService;

        const error = yield* service
          .getWeek(DateTime.makeUnsafe('2025-01-06T00:00:00Z').pipe(DateTime.toDateUtc), 'contact-1', 'Invalid/Zone')
          .pipe(Effect.flip);

        expect(error._tag).toBe('TloParseError');

        expect(yield* Ref.get(requests)).toStrictEqual([]);
      }),
    ),
  );

  it.effect('preserves local-time writes and omitted update dates', () =>
    withClient((requests) =>
      Effect.gen(function* () {
        const service = yield* TimeService;

        const startDate = DateTime.makeZonedUnsafe(
          { year: 2025, month: 1, day: 15, hour: 10, minute: 20, second: 30 },
          { timeZone: DateTime.zoneMakeLocal(), adjustForTimeZone: true },
        ).pipe(DateTime.toDateUtc);

        yield* service.createActivity({ startDate, durationMinutes: 30, folderId: 'folder-1', contactId: 'contact-1' });

        yield* service.updateActivity({ id: 1, startDate });

        yield* service.updateActivity({ id: 1, durationMinutes: 45 });

        const posted = yield* Ref.get(requests);

        expect(posted[0]?.body).toMatchObject({ ACTION: 'CREATE', DT: '2025-01-15T10:20:30' });

        expect(posted[1]?.body).toMatchObject({ ACTION: 'MOVE', DT: '2025-01-15T10:20:30' });

        expect(posted[2]?.body).toMatchObject({ ACTION: 'MOVE', DT: undefined, DURATION: 45 });
      }),
    ),
  );
});

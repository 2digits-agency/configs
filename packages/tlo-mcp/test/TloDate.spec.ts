import { describe, expect, it } from '@effect/vitest';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { formatTloDate, TloDate, TloDateString, TloResponse } from '../src/schemas/common.js';

describe('local TLO date codec', () => {
  for (const value of [
    '20260231120000',
    '20260229120000',
    '19000229120000',
    '21000229120000',
    '20260431120000',
    '20260015120000',
    '20261315120000',
    '20260100120000',
    '20260132120000',
    '20260115240000',
    '20260115126000',
    '20260115120060',
    '2026011512000',
    '202601151200000',
    '20260115abcdef',
  ]) {
    it.effect(`rejects invalid date ${value} with a typed schema failure`, () =>
      Effect.gen(function* () {
        const stringError = yield* Effect.flip(Schema.decodeEffect(TloDateString)(value));

        const dateError = yield* Effect.flip(Schema.decodeEffect(TloDate)(value));

        expect(Schema.isSchemaError(stringError)).toBeTruthy();

        expect(Schema.isSchemaError(dateError)).toBeTruthy();
      }),
    );
  }

  for (const value of ['20240229120000', '20000229120000', '20260101000000', '20261231235959', '99991231120000']) {
    it.effect(`roundtrips valid local date ${value}`, () =>
      Effect.gen(function* () {
        const date = yield* Schema.decodeEffect(TloDate)(value);

        const encoded = yield* Schema.encodeEffect(TloDate)(date);

        expect(encoded).toBe(value);

        expect(formatTloDate(date)).toBe(value);

        expect({
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate(),
          hour: date.getHours(),
          minute: date.getMinutes(),
          second: date.getSeconds(),
        }).toStrictEqual({
          year: Number(value.slice(0, 4)),
          month: Number(value.slice(4, 6)),
          day: Number(value.slice(6, 8)),
          hour: Number(value.slice(8, 10)),
          minute: Number(value.slice(10, 12)),
          second: Number(value.slice(12, 14)),
        });
      }),
    );
  }

  it.effect('preserves the existing 1900 offset for years below 100', () =>
    Effect.gen(function* () {
      const date = yield* Schema.decodeEffect(TloDate)('00990115120000');

      expect(date.getFullYear()).toBe(1999);

      expect(yield* Schema.encodeEffect(TloDate)(date)).toBe('19990115120000');
    }),
  );

  it.effect('preserves the date codec through response envelopes', () =>
    Effect.gen(function* () {
      const schema = TloResponse(TloDate);

      const response = yield* Schema.decodeEffect(schema)({ success: true, OBJ: '20260115120000' });

      const encoded = yield* Schema.encodeEffect(schema)(response);

      expect(response.OBJ.getFullYear()).toBe(2026);

      expect(encoded).toStrictEqual({ success: true, OBJ: '20260115120000' });
    }),
  );

  it.effect('preserves second precision when encoding dates with milliseconds', () =>
    Effect.gen(function* () {
      const date = yield* Schema.decodeEffect(TloDate)('20260115120000');

      date.setMilliseconds(123);

      expect(yield* Schema.encodeEffect(TloDate)(date)).toBe('20260115120000');
    }),
  );

  it.effect('rejects invalid Date values with a typed schema failure', () =>
    Effect.gen(function* () {
      const date = DateTime.toDateUtc(DateTime.makeUnsafe(0));

      date.setTime(Number('invalid'));

      const error = yield* Effect.flip(Schema.encodeEffect(TloDate)(date));

      expect(Schema.isSchemaError(error)).toBeTruthy();
    }),
  );

  it.effect('rejects years that cannot fit the wire format with a typed schema failure', () =>
    Effect.gen(function* () {
      const date = DateTime.toDateUtc(DateTime.makeUnsafe(0));

      date.setFullYear(10_000, 0, 15);

      const error = yield* Effect.flip(Schema.encodeEffect(TloDate)(date));

      expect(Schema.isSchemaError(error)).toBeTruthy();
    }),
  );
});

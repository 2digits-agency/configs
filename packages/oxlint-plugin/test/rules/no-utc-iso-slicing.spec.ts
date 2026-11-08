import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { noUtcIsoSlicing } from '../../src/rules/no-utc-iso-slicing';

RuleTester.describe = describe;

RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: 'ts' },
    sourceType: 'module',
  },
});

const error = { messageId: 'utcIsoSlicing' };

tester.run('no-utc-iso-slicing', noUtcIsoSlicing, {
  valid: [
    `
      declare const date: Date
      const timestamp = date.toISOString()
    `,
    `
      import * as DateTime from 'effect/DateTime'
      declare const now: DateTime.Utc
      const today = DateTime.formatIsoDate(DateTime.setZone(now, DateTime.zoneMakeNamedUnsafe('Europe/Amsterdam')))
      const month = DateTime.formatIsoDate(DateTime.setZone(now, zone)).slice(0, 7)
    `,
    `
      import * as DateTime from 'effect/DateTime'
      import * as Fn from 'effect/Function'
      import * as Str from 'effect/String'
      const month = Fn.pipe(now, DateTime.setZone(zone), DateTime.formatIsoOffset, Str.slice(0, 7))
      const instant = Fn.pipe(DateTime.formatIso(now), Str.toUpperCase)
    `,
    `
      declare const name: string
      const prefix = name.slice(0, 10)
      const parts = date.toISOString(locale).split('T')
    `,
    `
      const DateTime = { formatIso: (value: string) => value }
      const trimmed = DateTime.formatIso(input).slice(0, 10)
    `,
  ],
  invalid: [
    {
      code: `
        const today = new Date().toISOString().slice(0, 10)
      `,
      errors: [error],
    },
    {
      code: `
        declare const observationDate: Date
        const day = observationDate.toISOString().split('T')[0]
        const start = startDate?.toISOString().substring(0, 10)
        const legacy = (startDate as Date).toISOString().substr(0, 10)
      `,
      errors: [error, error, error],
    },
    {
      code: `
        const element = <input type="date" max={new Date().toISOString().slice(0, 10)} />
      `,
      languageOptions: { parserOptions: { lang: 'tsx' } },
      errors: [error],
    },
    {
      code: `
        import * as DateTime from 'effect/DateTime'
        const createdAt = DateTime.formatIso(now).replace(/Z$/, '000+00:00')
        const local = DateTime.formatIso(now).slice(0, 19)
      `,
      errors: [error, error],
    },
    {
      code: `
        import { DateTime, pipe, String as Str } from 'effect'
        const today = pipe(DateTime.formatIso(now), Str.slice(0, 10))
      `,
      errors: [error],
    },
    {
      code: `
        import * as DateTime from 'effect/DateTime'
        import * as Fn from 'effect/Function'
        import * as Str from 'effect/String'
        const today = Fn.pipe(DateTime.formatIso(now), Str.slice(0, 10))
        const day = Fn.pipe(DateTime.formatIso(now), Str.split('T'))
        const offset = Fn.pipe(DateTime.formatIso(now), Str.replace(/Z$/, '+00:00'))
      `,
      errors: [error, error, error],
    },
    {
      code: `
        import * as DT from 'effect/DateTime'
        import * as Fn from 'effect/Function'
        import * as Str from 'effect/String'
        const today = DT.formatIso(now).pipe(Str.slice(0, 10))
        const fromNow = now.pipe(DT.formatIso, Str.takeLeft(10))
        const format = Fn.flow(DT.formatIso, Str.slice(0, 10))
      `,
      errors: [error, error, error],
    },
    {
      code: `
        import * as DateTime from 'effect/DateTime'
        import * as Str from 'effect/String'
        const parts = Str.split(DateTime.formatIso(now), 'T')
        const today = Str.slice(0, 10)(date.toISOString())
      `,
      errors: [error, error],
    },
  ],
});

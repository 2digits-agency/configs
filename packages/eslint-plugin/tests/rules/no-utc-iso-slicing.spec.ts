import parser from '@typescript-eslint/parser';
import { run, type InvalidTestCase, type ValidTestCase, unindent as typescript } from 'eslint-vitest-rule-tester';

import { noUtcIsoSlicing, RULE_NAME } from '../../src/rules/no-utc-iso-slicing';

const error = { messageId: 'utcIsoSlicing' } as const;

const valids: Array<ValidTestCase> = [
  typescript`
    declare const date: Date
    const timestamp = date.toISOString()
  `,
  typescript`
    import * as DateTime from 'effect/DateTime'
    const today = DateTime.formatIsoDate(DateTime.setZone(now, DateTime.zoneMakeNamedUnsafe('Europe/Amsterdam')))
    const month = DateTime.formatIsoDate(DateTime.setZone(now, zone)).slice(0, 7)
  `,
  typescript`
    import * as DateTime from 'effect/DateTime'
    import * as Fn from 'effect/Function'
    import * as Str from 'effect/String'
    const month = Fn.pipe(now, DateTime.setZone(zone), DateTime.formatIsoOffset, Str.slice(0, 7))
    const instant = Fn.pipe(DateTime.formatIso(now), Str.toUpperCase)
  `,
  typescript`
    declare const name: string
    const prefix = name.slice(0, 10)
    const parts = date.toISOString(locale).split('T')
  `,
  typescript`
    const DateTime = { formatIso: (value: string) => value }
    const trimmed = DateTime.formatIso(input).slice(0, 10)
  `,
];

const invalids: Array<InvalidTestCase> = [
  {
    code: typescript`const today = new Date().toISOString().slice(0, 10)`,
    errors: [error],
  },
  {
    code: typescript`
      declare const observationDate: Date
      const day = observationDate.toISOString().split('T')[0]
      const start = startDate?.toISOString().substring(0, 10)
      const legacy = (startDate as Date).toISOString().substr(0, 10)
    `,
    errors: [error, error, error],
  },
  {
    code: typescript`const element = <input type="date" max={new Date().toISOString().slice(0, 10)} />`,
    parserOptions: { ecmaFeatures: { jsx: true } },
    errors: [error],
  },
  {
    code: typescript`
      import * as DateTime from 'effect/DateTime'
      const createdAt = DateTime.formatIso(now).replace(/Z$/, '000+00:00')
      const local = DateTime.formatIso(now).slice(0, 19)
    `,
    errors: [error, error],
  },
  {
    code: typescript`
      import { DateTime, pipe, String as Str } from 'effect'
      const today = pipe(DateTime.formatIso(now), Str.slice(0, 10))
    `,
    errors: [error],
  },
  {
    code: typescript`
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
    code: typescript`
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
    code: typescript`
      import * as DateTime from 'effect/DateTime'
      import * as Str from 'effect/String'
      const parts = Str.split(DateTime.formatIso(now), 'T')
      const today = Str.slice(0, 10)(date.toISOString())
    `,
    errors: [error, error],
  },
];

await run({
  parser,
  name: RULE_NAME,
  rule: noUtcIsoSlicing,
  valid: valids,
  invalid: invalids,
});

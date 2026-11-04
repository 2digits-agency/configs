import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { alchemyDomainTotalHandlers } from '../../../src/rules/alchemy/alchemy-domain-total-handlers';

RuleTester.describe = describe;

RuleTester.it = it;

const header = `
  import * as Domain from '@alchemy.run/domain'
  import * as Opt from 'effect/Option'
`;

new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } }).run(
  'alchemy-domain-total-handlers',
  alchemyDomainTotalHandlers,
  {
    valid: [
      `${header}
        export class DailyImport extends Domain.Aggregate('DailyImport', {
          decide: { Start: (s) => { if (Opt.isNone(s.running)) throw new Error('decide may refuse') ; return [] } },
          evolve: { Started: (s, e) => (s._tag === 'Open' ? { ...s, runId: e.runId } : s) },
          reply: { Start: (s) => ({ runId: Opt.getOrNull(s.running) }) },
        }) {}
      `,
      `${header}
        export class Status extends Domain.View('Status', {
          evolve: { Started: (v, e) => ({ ...v, runId: e.runId }) },
          validate: (_request, v) => Opt.getOrThrow(v.owner),
        }) {}
      `,
      `${header}
        export class Account extends Domain.Policy('Account', { evolve: { Started: () => { throw new Error() } } }) {}
      `,
    ],
    invalid: [
      {
        code: `${header}
          export class DailyImport extends Domain.Aggregate('DailyImport', {
            reply: { StartDailyImport: (s) => ({ runId: Opt.getOrThrow(s.running) }) },
          }) {}
        `,
        errors: [{ messageId: 'partial', data: { section: 'reply', api: '`Option.getOrThrow`' } }],
      },
      {
        code: `${header}
          export class Account extends Domain.Aggregate('Account', {
            evolve: {
              MoneyDeposited: (s, e) => {
                if (s._tag !== 'Open') throw new Error('not open')
                return { ...s, balance: e.balanceAfter }
              },
            },
          }) {}
        `,
        errors: [{ messageId: 'partial', data: { section: 'evolve', api: '`throw`' } }],
      },
      {
        code: `${header}
          export class Book extends Domain.View('Book', {
            evolve: { Posted: (v, e) => ({ ...v, lines: e.lines.map((line) => Opt.getOrThrowWith(line.amount, () => new Error())) }) },
          }) {}
        `,
        errors: [{ messageId: 'partial', data: { section: 'evolve', api: '`Option.getOrThrowWith`' } }],
      },
      {
        code: `${header}
          export class Account extends Domain.Aggregate('Account', {
            evolve: { Renamed: (s, e) => Struct.evolve(s, { name: () => Opt.getOrThrow(e.name) }) },
          }) {}
        `,
        errors: [{ messageId: 'partial', data: { section: 'evolve', api: '`Option.getOrThrow`' } }],
      },
      {
        code: `${header}
          import { pipe } from 'effect/Function'
          export class DailyImport extends Domain.Aggregate('DailyImport', {
            reply: { Start: (s) => ({ runId: pipe(s.running, Opt.getOrThrow) }) },
          }) {}
        `,
        errors: [{ messageId: 'partial', data: { section: 'reply', api: '`Option.getOrThrow`' } }],
      },
    ],
  },
);

/* eslint-disable turbo/no-undeclared-env-vars -- The corpus recorder is only enabled by the uncached benchmark script. */
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { appendFileSync } from 'node:fs';

import * as Arr from 'effect/Array';
import * as Opt from 'effect/Option';
import * as R from 'effect/Record';
import { RuleTester } from 'oxlint/plugins-dev';

import { rules } from '../src';

const run = RuleTester.prototype.run;

function captureCases(this: RuleTester, ...args: Parameters<RuleTester['run']>): void {
  const [name, rule, cases] = args;

  const canonical = Arr.findFirst(R.toEntries(rules), ([, registered]) => registered === rule).pipe(
    Opt.map(([key]) => key),
    Opt.getOrElse(() => name),
  );

  const destination = process.env.OXLINT_BENCH_CORPUS;

  if (!destination) {
    throw new Error('OXLINT_BENCH_CORPUS must name the benchmark capture file.');
  }

  for (const testCase of [...cases.valid, ...cases.invalid]) {
    const entry = typeof testCase === 'string' ? { code: testCase } : testCase;

    appendFileSync(destination, `${JSON.stringify({ rule: canonical, ...entry })}\n`);
  }

  return run.call(this, ...args);
}

if (run.name !== 'captureCases') {
  RuleTester.prototype.run = captureCases;
}

import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { noAccumulatingLoop } from '../../../src/rules/smells/no-accumulating-loop';

RuleTester.describe = describe;

RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: 'ts' },
    sourceType: 'module',
  },
});

const push = 'calling `.push`';

function error(target: string, how: string) {
  return [{ messageId: 'loop', data: { target, how } }];
}

tester.run('no-accumulating-loop', noAccumulatingLoop, {
  valid: [
    // Side effects only, or a collection local to each iteration.
    'for (const user of users) { notify(user); }',
    'for (const row of rows) { const cells = []; cells.push(row.a); emit(cells); }',
    // Searches that exit early.
    'const found = []; for (const x of xs) { if (x.done) break; found.push(x); }',
    'function f(xs) { const kept = []; for (const x of xs) { if (!x) return null; kept.push(x); } return kept; }',
    'const out = []; outer: for (const x of xs) { for (const y of x) { if (y) break outer; out.push(y); } }',
    // Condition loops are cursors, pagination or parsers.
    'const pages = []; while (hasMore()) pages.push(next());',
    // Awaiting loops belong to no-await-in-loop.
    'async function load(ids) { const users = []; for (const id of ids) users.push(await fetchUser(id)); return users; }',
    'async function drain(stream) { const chunks = []; for await (const chunk of stream) chunks.push(chunk); return chunks; }',
    // Numeric totals and flags are not collections.
    'let total = 0; for (const x of xs) total += x.amount;',
    // A loop that also updates other outer state is a state machine.
    'const depths = []; let depth = 0; for (const token of tokens) { depth += token.delta; depths.push(depth); }',
    'const saved = new Map(); for (const m of methods) { saved.set(m, console[m]); console[m] = noop; }',
    'const removed = []; for (const [id, host] of hosts) { if (host.stale) { hosts.delete(id); removed.push(id); } }',
    // The collection does not start empty, or is not a local.
    'const seen = new Set(initial); for (const x of xs) seen.add(x);',
    'const merged = [...defaults]; for (const x of xs) merged.push(x);',
    'function fill(target, xs) { for (const x of xs) target.push(x); }',
    'for (const x of xs) window.items.push(x);',
    // The loop reads what it builds: deduplication, worklists and length checks.
    'const unique = []; for (const x of xs) { if (!unique.includes(x)) unique.push(x); }',
    'const visited = new Set(); for (const x of xs) { if (visited.has(x.id)) dup(x); visited.add(x.id); }',
    'const queue = []; queue.push(root); for (const node of queue) queue.push(...node.children);',
    'const firstFive = []; for (const x of xs) { if (firstFive.length < 5) firstFive.push(x); }',
    // Reads of the collection inside the added value, or through a computed method call.
    'const out = []; for (const x of xs) out.push(out.includes(x) ? null : x);',
    'const out = []; for (const x of xs) out.push({ x, index: out.length });',
    "const out = []; for (const x of xs) { if (!out['includes'](x)) out.push(x); }",
    "const seen = new Set(); for (const x of xs) { if (seen['has'](x)) dup(x); seen.add(x); }",
    // A listener the loop registers fills the collection later.
    "const events = []; for (const socket of sockets) socket.on('data', (data) => events.push(data));",
    // Other code builds the collection too.
    'const both = []; for (const x of xs) both.push(x); for (const y of ys) both.push(y);',
    'const ids = []; for (const x of xs) ids.push(x.id); ids.push(extra);',
    'const cache = new Map(); export function remember(xs) { for (const x of xs) cache.set(x.id, x); }',
    // Deduplication through a second collection makes the whole loop stateful.
    'const keys = new Set(); const firsts = []; for (const x of xs) { if (keys.has(x.k)) continue; keys.add(x.k); firsts.push(x); }',
    {
      code: 'const emails = []; for (const user of users) emails.push(user.email);',
      filename: 'users.spec.ts',
    },
  ],
  invalid: [
    {
      code: 'const emails = []; for (const user of users) { if (user.active) emails.push(user.email); } send(emails);',
      errors: error('emails', push),
    },
    {
      // Writes to a per-iteration local do not count as outer state.
      code: 'const byId = {}; for (const item of items) { const copy = { ...item }; copy.seen = true; byId[item.id] = copy; }',
      errors: error('byId', 'assigning computed keys'),
    },
    {
      code: 'const index = new Map<string, number>(); for (let i = 0; i < rows.length; i++) index.set(rows[i].id, i);',
      errors: error('index', 'calling `.set`'),
    },
    {
      code: 'let all = []; for (const group of groups) { all = [...all, ...group.items]; }',
      errors: error('all', 'copying it with a spread'),
    },
    {
      code: 'let all = []; for (const key in record) all = all.concat(record[key]);',
      errors: error('all', 'calling `.concat`'),
    },
    {
      code: 'function* f(ids) { const users = []; for (const id of ids) { users.push(yield* load(id)); } return users; }',
      errors: error('users', push),
    },
    {
      // Grouping reads entries back, which a `groupBy` replaces.
      code: 'const groups = new Map(); for (const x of xs) { const list = groups.get(x.k) ?? []; list.push(x); groups.set(x.k, list); }',
      errors: error('groups', 'calling `.set`'),
    },
    {
      // Only the outermost loop over the collection is reported.
      code: 'const pairs = []; for (const a of xs) { for (const b of ys) { pairs.push([a, b]); } }',
      errors: error('pairs', push),
    },
    {
      // These `break`s leave only the inner loop or the switch.
      code: 'const out = []; for (const x of xs) { for (const y of x) { if (!y) break; out.push(y); } }',
      errors: error('out', push),
    },
    {
      code: "const picked = new Set(); for (const x of xs) { switch (x.kind) { case 'a': picked.add(x); break; } }",
      errors: error('picked', 'calling `.add`'),
    },
    {
      // A `return` inside a callback does not leave the loop.
      code: 'const names = []; for (const g of groups) names.push(...g.items.map((item) => { return item.name; }));',
      errors: error('names', push),
    },
  ],
});

import type { ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import type * as DateTime from 'effect/DateTime';
import type * as Effect from 'effect/Effect';

import { canonicalPath, defineEffectRule, isAnyApi, isGlobalIdentifier, ruleMeta, staticPath } from '../../utils';
import { domainSection, isReference } from './domain';

type Impurity = 'io' | 'random' | 'time';

const globalImpurities: ReadonlyMap<string, Impurity> = new Map([
  ['Date.now', 'time'],
  ['performance.now', 'time'],
  ['Math.random', 'random'],
  ['crypto.randomUUID', 'random'],
  ['crypto.getRandomValues', 'random'],
]);

// Deterministic effect/crypto modules (Digest, Mac, Kdf, KeyFormat) stay allowed.
const effectModuleImpurities: ReadonlyMap<string, Impurity> = new Map([
  ['Clock', 'time'],
  ['Random', 'random'],
  ['SecureRandom', 'random'],
  ['Aead', 'random'],
  ['Cipher', 'random'],
  ['Signature', 'random'],
  ['KeyAgreement', 'random'],
  ['KeyWrap', 'random'],
  ['Jwk', 'random'],
  ['Jwe', 'random'],
  ['Jws', 'random'],
  ['Jwt', 'time'],
  ['Jwks', 'io'],
]);

const dateTimeNow: ReadonlyArray<string> = [
  'now',
  'nowAsDate',
  'nowInCurrentZone',
  'nowUnsafe',
] satisfies ReadonlyArray<keyof typeof DateTime>;

const effectIo: ReadonlyArray<string> = ['promise', 'tryPromise'] satisfies ReadonlyArray<keyof typeof Effect>;

export const alchemyDomainPureDecide: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Require Alchemy Domain aggregate decide handlers to be pure.',
    {
      time: '`decide` reads time from its `now` argument, not {{api}}. Replays must decide the same way.',
      random:
        '`decide` must be deterministic, so it cannot use {{api}}. Take the value from the command input instead.',
      io: '`decide` never performs I/O such as {{api}}. Call external systems from a policy or saga and send the result as a command.',
    },
    'https://alchemy.run/domain/aggregate',
  ),
  (context, getState) => {
    function report(node: ESTree.Node, impurity: Impurity | undefined, api: string): void {
      if (impurity !== undefined && domainSection(node, getState())?.section === 'decide') {
        context.report({ node, messageId: impurity, data: { api } });
      }
    }

    // `Clock.currentTimeMillis`, or `currentTimeMillis` imported from `effect/Clock`.
    function checkModule(node: ESTree.Node): void {
      const canonical = canonicalPath(node, getState());

      const module = canonical?.[0];

      if (module === undefined || canonical?.length !== 2) {
        return;
      }

      report(
        node,
        module === 'DateTime' && dateTimeNow.includes(canonical[1] ?? '') ? 'time' : effectModuleImpurities.get(module),
        Arr.join(canonical, '.'),
      );
    }

    return {
      // Inner members such as `DateTime.now` in `DateTime.now.pipe(...)` are checked too; longer paths are skipped.
      MemberExpression(node) {
        const path = staticPath(node);

        const name = path === undefined ? undefined : Arr.join(path, '.');

        if (name !== undefined && path?.length === 2 && isGlobalIdentifier(node.object, context, path[0] ?? '')) {
          report(node, globalImpurities.get(name), `${name}()`);

          return;
        }

        checkModule(node);
      },
      Identifier(node) {
        if (isReference(node)) {
          checkModule(node);
        }
      },
      NewExpression(node) {
        if (node.arguments.length === 0 && isGlobalIdentifier(node.callee, context, 'Date')) {
          report(node, 'time', 'new Date()');
        }
      },
      CallExpression(node) {
        if (isGlobalIdentifier(node.callee, context, 'fetch')) {
          report(node, 'io', 'fetch()');
        } else if (isAnyApi(node.callee, getState(), 'Effect', effectIo)) {
          report(node, 'io', Arr.join(canonicalPath(node.callee, getState()) ?? ['a promise'], '.'));
        }
      },
    };
  },
);

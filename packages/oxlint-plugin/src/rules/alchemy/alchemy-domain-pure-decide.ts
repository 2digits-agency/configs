import type { ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import type * as Effect from 'effect/Effect';

import { defineEffectRule, isGlobalIdentifier, ruleMeta, staticPath } from '../../utils';
import { domainSection, importedPath, isImportReference } from './domain';

type Impurity = 'io' | 'random' | 'time';

const globalImpurities: ReadonlyMap<string, Impurity> = new Map([
  ['Date.now', 'time'],
  ['performance.now', 'time'],
  ['Math.random', 'random'],
  ['crypto.randomUUID', 'random'],
  ['crypto.getRandomValues', 'random'],
]);

// Every member of these modules reads time or randomness.
const moduleImpurities: ReadonlyMap<string, Impurity> = new Map([
  ['Clock', 'time'],
  ['Random', 'random'],
  ['SecureRandom', 'random'],
]);

/*
 * Single members of modules that are otherwise deterministic, such as `Jws.sign` next to `Jws.verify`. Crypto services
 * count through their tag, since their methods are called on the yielded service. Digest, Mac, Kdf and KeyFormat stay
 * allowed.
 */
const memberImpurities: ReadonlyMap<string, Impurity> = new Map([
  ['DateTime.now', 'time'],
  ['DateTime.nowAsDate', 'time'],
  ['DateTime.nowInCurrentZone', 'time'],
  ['DateTime.nowUnsafe', 'time'],
  ['DateTime.isFuture', 'time'],
  ['DateTime.isFutureUnsafe', 'time'],
  ['DateTime.isPast', 'time'],
  ['DateTime.isPastUnsafe', 'time'],
  ['Aead.Aead', 'random'],
  ['Cipher.Cipher', 'random'],
  ['Signature.Signature', 'random'],
  ['KeyAgreement.KeyAgreement', 'random'],
  ['KeyWrap.KeyWrap', 'random'],
  ['Jwk.generateKeyPair', 'random'],
  ['Jwk.generateSecret', 'random'],
  ['Jwe.encrypt', 'random'],
  ['Jws.sign', 'random'],
  ['Jws.verifyWithKeySet', 'io'],
  ['Jwt.sign', 'random'],
  ['Jwt.encrypt', 'random'],
  ['Jwt.verify', 'time'],
  ['Jwt.verifyWithKeySet', 'time'],
  ['Jwt.decrypt', 'time'],
  ['Jwks.Jwks', 'io'],
  ['Jwks.makeRemote', 'io'],
  ['Jwks.layerRemote', 'io'],
]);

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
      if (impurity !== undefined && domainSection(node, getState(), context)?.section === 'decide') {
        context.report({ node, messageId: impurity, data: { api } });
      }
    }

    // `Clock.currentTimeMillis`, or `currentTimeMillis` imported from `effect/Clock`.
    function checkModule(node: ESTree.Node): void {
      const canonical = importedPath(node, getState(), context);

      const module = canonical?.[0];

      if (module === undefined || canonical?.length !== 2) {
        return;
      }

      const name = Arr.join(canonical, '.');

      report(node, memberImpurities.get(name) ?? moduleImpurities.get(module), name);
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
        if (isImportReference(node, context)) {
          checkModule(node);
        }
      },
      NewExpression(node) {
        if (node.arguments.length === 0 && isGlobalIdentifier(node.callee, context, 'Date')) {
          report(node, 'time', 'new Date()');
        }
      },
      CallExpression(node) {
        if (isGlobalIdentifier(node.callee, context, 'Date')) {
          report(node, 'time', 'Date()');
        } else if (isGlobalIdentifier(node.callee, context, 'fetch')) {
          report(node, 'io', 'fetch()');
        } else {
          const path = importedPath(node.callee, getState(), context);

          if (path?.length === 2 && path[0] === 'Effect' && effectIo.includes(path[1] ?? '')) {
            report(node, 'io', Arr.join(path, '.'));
          }
        }
      },
    };
  },
);

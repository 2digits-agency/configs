import { Diagnostic, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as R from 'effect/Record';
import * as Schema from 'effect/Schema';

import { staticPath } from '../../internal/ast';
import { importBindings, namespaceMember } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';
import { isGlobalIn } from '../../internal/scope';
import { domainSection, importedPath, isImportReference, type DomainFile } from './internal/domain';

type Impurity = 'io' | 'random' | 'time';

const globalImpurities: Readonly<Record<string, Impurity>> = {
  'Date.now': 'time',
  'performance.now': 'time',
  'performance.timeOrigin': 'time',
  'Math.random': 'random',
  'crypto.randomUUID': 'random',
  'crypto.getRandomValues': 'random',
};

// Every member of these modules reads time or randomness.
const moduleImpurities: Readonly<Record<string, Impurity>> = {
  Clock: 'time',
  Random: 'random',
  SecureRandom: 'random',
};

/*
 * Single members of modules that are otherwise deterministic, such as `Jws.sign` next to `Jws.verify`. Crypto services
 * count through their tag, since their methods are called on the yielded service. Digest, Mac, Kdf and KeyFormat stay
 * allowed.
 */
const memberImpurities: Readonly<Record<string, Impurity>> = {
  'DateTime.now': 'time',
  'DateTime.nowAsDate': 'time',
  'DateTime.nowInCurrentZone': 'time',
  'DateTime.nowUnsafe': 'time',
  'DateTime.isFuture': 'time',
  'DateTime.isFutureUnsafe': 'time',
  'DateTime.isPast': 'time',
  'DateTime.isPastUnsafe': 'time',
  'Aead.Aead': 'random',
  'Cipher.Cipher': 'random',
  'Signature.Signature': 'random',
  'KeyAgreement.KeyAgreement': 'random',
  'KeyWrap.KeyWrap': 'random',
  'Jwk.generateKeyPair': 'random',
  'Jwk.generateSecret': 'random',
  'Jwe.encrypt': 'random',
  'Jws.sign': 'random',
  'Jws.verifyWithKeySet': 'io',
  'Jwt.sign': 'random',
  'Jwt.encrypt': 'random',
  'Jwt.verify': 'time',
  'Jwt.verifyWithKeySet': 'time',
  'Jwt.decrypt': 'time',
  'Jwks.Jwks': 'io',
  'Jwks.makeRemote': 'io',
  'Jwks.layerRemote': 'io',
};

const isEffectIo = Schema.is(Schema.Literals(['promise', 'tryPromise'] satisfies ReadonlyArray<keyof typeof Effect>));

function memberRoot(node: ESTree.Node): ESTree.Node {
  let root = node;

  while (root.type === 'MemberExpression' || root.type === 'ChainExpression') {
    root = root.type === 'ChainExpression' ? root.expression : root.object;
  }

  return root;
}

export const alchemyDomainPureDecide: CreateRule = defineRule({
  name: 'alchemy-domain-pure-decide',
  meta: ruleMeta({
    type: 'problem',
    description: 'Require Alchemy Domain aggregate decide handlers to be pure.',
    messages: {
      time: '`decide` reads time from its `now` argument, not {{api}}. Replays must decide the same way.',
      random:
        '`decide` must be deterministic, so it cannot use {{api}}. Take the value from the command input instead.',
      io: '`decide` never performs I/O such as {{api}}. Call external systems from a policy or saga and send the result as a command.',
    },
    url: 'https://alchemy.run/domain/aggregate',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const file: DomainFile = { sourceCode: ctx.sourceCode, imports: yield* importBindings };

    if (!file.imports.hasNamespace('Domain')) {
      return {};
    }

    function isGlobal(node: ESTree.Node, name: string) {
      return isGlobalIn(ctx.sourceCode.getScope(node), node, name);
    }

    function report(node: ESTree.Node, impurity: Opt.Option<Impurity>, api: string) {
      return Opt.match(
        Opt.filter(impurity, () => Opt.exists(domainSection(node, file), ({ section }) => section === 'decide')),
        {
          onNone: () => Effect.void,
          onSome: (messageId) => ctx.report(Diagnostic.fromId({ node, messageId, data: { api } })),
        },
      );
    }

    // `Clock.currentTimeMillis`, or `currentTimeMillis` imported from `effect/Clock`.
    function checkModule(node: ESTree.Node) {
      return Opt.match(
        Opt.filter(importedPath(node, file), (path) => path.length === 2),
        {
          onNone: () => Effect.void,
          onSome: (path) => {
            const name = Arr.join(path, '.');

            return report(
              node,
              Opt.orElse(R.get(memberImpurities, name), () =>
                Opt.flatMap(Arr.head(path), (module) => R.get(moduleImpurities, module)),
              ),
              name,
            );
          },
        },
      );
    }

    // `Date` or `globalThis.Date`, when not shadowed.
    function globalCallee(callee: ESTree.Node): Opt.Option<string> {
      if (callee.type === 'Identifier') {
        return isGlobal(callee, callee.name) ? Opt.some(callee.name) : Opt.none();
      }

      return callee.type === 'MemberExpression' && isGlobal(callee.object, 'globalThis')
        ? Opt.flatMap(
            Opt.filter(staticPath(callee), (path) => path.length === 2),
            (path) => Arr.get(path, 1),
          )
        : Opt.none();
    }

    return Visitor.merge(
      // Inner members such as `DateTime.now` in `DateTime.now.pipe(...)` are checked too; longer paths are skipped.
      Visitor.on('MemberExpression', (node) => {
        const path = Opt.getOrElse(staticPath(node), (): ReadonlyArray<string> => []);

        const first = Arr.head(path);

        // `globalThis.Date.now` is the same as `Date.now`.
        const global = Opt.contains(first, 'globalThis') ? path.slice(1) : path;

        const root = memberRoot(node);

        if (global.length !== 2 || !Opt.exists(first, (name) => isGlobal(root, name))) {
          return checkModule(node);
        }

        const name = Arr.join(global, '.');

        const called = node.parent.type === 'CallExpression' && node.parent.callee === node;

        return report(node, R.get(globalImpurities, name), called ? `${name}()` : name);
      }),
      Visitor.on('Identifier', (node) =>
        file.imports.bindings.has(node.name) && isImportReference(node, ctx.sourceCode)
          ? checkModule(node)
          : Effect.void,
      ),
      Visitor.on('NewExpression', (node) =>
        Arr.isReadonlyArrayEmpty(node.arguments) && Opt.contains(globalCallee(node.callee), 'Date')
          ? report(node, Opt.some('time'), 'new Date()')
          : Effect.void,
      ),
      Visitor.on('CallExpression', (node) =>
        Match.value(Opt.getOrElse(globalCallee(node.callee), () => '')).pipe(
          Match.when('Date', () => report(node, Opt.some('time'), 'Date()')),
          Match.when('fetch', () => report(node, Opt.some('io'), 'fetch()')),
          Match.orElse(() =>
            Opt.match(
              Opt.filter(
                Opt.flatMap(importedPath(node.callee, file), (path) => namespaceMember(path, 'Effect')),
                isEffectIo,
              ),
              {
                onNone: () => Effect.void,
                onSome: (member) => report(node, Opt.some('io'), `Effect.${member}`),
              },
            ),
          ),
        ),
      ),
    );
  },
});

import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { importBindings, moduleImportMember } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { onRuntimeImport, packageName } from './internal/package-imports';

/**
 * Packages that hash with Argon2id or PBKDF2, the algorithms `Password` supports. bcrypt and scrypt packages are left
 * out: `Password` cannot verify their hashes, so moving to it means rehashing every stored password.
 */
const passwordPackages: ReadonlyArray<string> = ['@node-rs/argon2', 'argon2', 'argon2-browser', 'pbkdf2'];

/**
 * Entry points of broader packages that only hold Argon2id or PBKDF2.
 */
const passwordModules: ReadonlyArray<string> = [
  '@noble/hashes/argon2',
  '@noble/hashes/argon2.js',
  '@noble/hashes/pbkdf2',
  '@noble/hashes/pbkdf2.js',
  'crypto-js/pbkdf2',
];

const cryptoSources: ReadonlyArray<string> = ['crypto', 'node:crypto'];

const nodePbkdf2: ReadonlyArray<string> = ['pbkdf2', 'pbkdf2Sync'];

export const preferEffectPassword = Rule.define({
  name: 'prefer-effect-password',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer the Effect Password service over Argon2 and PBKDF2 libraries in Effect projects.',
    messages: {
      password:
        'Use the Password service from effect/crypto instead of {{api}} to hash and verify passwords: it stores Argon2id or PBKDF2 hashes as PHC strings, verifies them with the costs each hash states and reports when one needs a rehash. To derive a key instead, use Kdf from effect/crypto.',
    },
    url: 'https://effect.website/docs/v4/api/effect/crypto/Password',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    function report(node: ESTree.Node, api: string) {
      return ctx.report(Diagnostic.fromId({ node, messageId: 'password', data: { api } }));
    }

    return Visitor.merge(
      onRuntimeImport((source) =>
        Arr.contains(passwordPackages, packageName(source.value)) || Arr.contains(passwordModules, source.value)
          ? report(source, source.value)
          : Effect.void,
      ),
      // `pbkdf2Sync(password, salt, …)` after `import { pbkdf2Sync } from 'node:crypto'`, or `crypto.pbkdf2(…)`.
      Visitor.on('CallExpression', (node) =>
        Opt.match(
          Opt.filter(moduleImportMember(ctx.sourceCode, node.callee, cryptoSources), (name) =>
            Arr.contains(nodePbkdf2, name),
          ),
          { onNone: () => Effect.void, onSome: (name) => report(node, `node:crypto ${name}`) },
        ),
      ),
    );
  },
});

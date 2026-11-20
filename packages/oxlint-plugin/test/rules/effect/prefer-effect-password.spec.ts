import * as Arr from 'effect/Array';
import { RuleTester } from 'oxlint/plugins-dev';

import { preferEffectPassword } from '../../../src/rules/effect/prefer-effect-password';
import { testRule } from '../../rule-tester';

const ruleName = 'prefer-effect-password';

const effect = `import * as Effect from 'effect/Effect';`;

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });

function invalid(code: string, ...apis: ReadonlyArray<string>) {
  return {
    code: `${effect}\n${code}`,
    errors: Arr.map(apis, (api) => ({ messageId: 'password', data: { api } })),
  };
}

testRule(ruleName, preferEffectPassword, {
  valid: `
    import * as Effect from 'effect/Effect'
    import { Password } from 'effect/crypto'
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    import argon2 from 'argon2'
  `,
  messageId: 'password',
  data: { api: 'argon2' },
});

tester.run(ruleName, preferEffectPassword, {
  valid: [
    // Only files that use Effect are checked.
    `import argon2 from 'argon2';`,
    // Password cannot verify bcrypt or scrypt hashes, so those stay allowed.
    `${effect} import bcrypt from 'bcrypt'; import { scryptSync } from 'node:crypto'; const key = scryptSync(password, salt, 64);`,
    // Other node:crypto functions, and a pbkdf2 that is not node:crypto's.
    `${effect} import { createHash, randomBytes } from 'node:crypto'; const digest = createHash('sha256');`,
    `${effect} import { pbkdf2 } from './kdf'; const key = pbkdf2(password, salt);`,
    `${effect} import * as crypto from 'node:crypto'; function derive(crypto: Hasher) { return crypto.pbkdf2(password) }`,
    `${effect} import { sha256 } from '@noble/hashes/sha2';`,
    `${effect} import type { Options } from 'argon2';`,
  ],
  invalid: [
    invalid(`import { hash, verify } from '@node-rs/argon2';`, '@node-rs/argon2'),
    invalid(`import { argon2id } from '@noble/hashes/argon2.js';`, '@noble/hashes/argon2.js'),
    invalid(`const { pbkdf2 } = await import('@noble/hashes/pbkdf2');`, '@noble/hashes/pbkdf2'),
    invalid(
      `import { pbkdf2Sync } from 'node:crypto'; const hash = pbkdf2Sync(password, salt, 600_000, 32, 'sha256');`,
      'node:crypto pbkdf2Sync',
    ),
    invalid(
      `import crypto from 'crypto'; crypto.pbkdf2(password, salt, 600_000, 32, 'sha256', callback);`,
      'node:crypto pbkdf2',
    ),
  ],
});

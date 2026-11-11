import { noManualEncoding } from '../../../src/rules/effect/no-manual-encoding';
import { createRuleTester, testRule } from '../../rule-tester';

const tester = createRuleTester();

testRule('no-manual-encoding', noManualEncoding, {
  valid: `
    import { Base64Url } from 'effect/encoding'
    const token = Base64Url.encode(bytes)
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    const token = btoa(text).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '')
  `,
  messageId: 'base64Url',
});

const effectImport = `import * as Effect from 'effect/Effect';`;

tester.run('no-manual-encoding chains and byte hex', noManualEncoding, {
  valid: [
    `token.replace(/\\+/g, '-').replace(/\\//g, '_');`,
    `${effectImport} query.replace(/\\+/g, ' ');`,
    `${effectImport} phone.replace(/-/g, '+').replace(/ /g, '_');`,
    `${effectImport} slug.replace(/\\//g, '_').trim();`,
    `import * as Str from 'effect/String'; import { pipe } from 'effect/Function'; pipe(slug, Str.replaceAll('/', '_'), Str.trim);`,
    `${effectImport} id.toString(16); color.toString(16).padStart(6, '0'); value.toString(16).padStart(2, ' ');`,
  ],
  invalid: [
    {
      code: `${effectImport} token.replaceAll('-', '+').replaceAll('_', '/');`,
      errors: [{ messageId: 'base64Url' }],
    },
    {
      code: `${effectImport} const url = encoded.replace(/[+]/g, '-').replace(/[/]/g, '_').length;`,
      errors: [{ messageId: 'base64Url' }],
    },
    {
      code: `
        import * as Fn from 'effect/Function';
        import * as Str from 'effect/String';
        Fn.pipe(btoa(value), Str.replaceAll('+', '-'), Str.replaceAll('/', '_'), Str.replaceAll('=', ''));
        decoded.pipe(Str.replace(/-/g, '+'), Str.replace(/_/g, '/'));
      `,
      errors: [{ messageId: 'base64Url' }, { messageId: 'base64Url' }],
    },
    {
      code: `${effectImport} Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');`,
      errors: [{ messageId: 'hex' }],
    },
    {
      code: `
        import * as Str from 'effect/String';
        import { pipe } from 'effect/Function';
        const a = Str.padStart(2, '0')(byte.toString(16));
        const b = pipe(byte.toString(16), Str.padStart(2, '0'));
      `,
      errors: [{ messageId: 'hex' }, { messageId: 'hex' }],
    },
  ],
});

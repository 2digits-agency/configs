import { RuleTester } from 'oxlint/plugins-dev';

import { preferEffectEncoding } from '../../../src/rules/effect/prefer-effect-encoding';
import { testRule } from '../../rule-tester';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });

testRule('prefer-effect-encoding', preferEffectEncoding, {
  valid: `
    import { Base64 } from 'effect/encoding'
    const encoded = Base64.encode('hello')
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    const encoded = btoa('hello')
  `,
  messageId: 'btoa',
});

const effectImport = `import * as Effect from 'effect/Effect';`;

tester.run('prefer-effect-encoding native APIs', preferEffectEncoding, {
  valid: [
    `atob(token); Buffer.from(token, 'base64');`,
    `${effectImport} const atob = (value: string) => value; atob(token);`,
    `${effectImport} Buffer.from(text, 'utf8'); bytes.toString('utf8'); count.toString(16); atob();`,
    `${effectImport} bytes.toBase64(); window.atob(token);`,
  ],
  invalid: [
    {
      code: `${effectImport} atob(token);`,
      errors: [{ messageId: 'atob' }],
    },
    {
      code: `${effectImport} globalThis.btoa(text);`,
      errors: [{ messageId: 'btoa' }],
    },
    {
      code: `${effectImport} Buffer.from(token, 'base64url');`,
      errors: [
        { messageId: 'decode', data: { native: "Buffer.from(…, 'base64url')", replacement: 'Base64Url.decode' } },
      ],
    },
    {
      code: `${effectImport} Buffer.from(text).toString('hex');`,
      errors: [{ messageId: 'encode', data: { native: "toString('hex')", replacement: 'Hex.encode' } }],
    },
    {
      code: `${effectImport} Uint8Array.fromHex(digest); Uint8Array.fromBase64(token); Uint8Array.fromBase64(token, { alphabet: 'base64url' });`,
      errors: [
        { messageId: 'decode', data: { native: 'Uint8Array.fromHex', replacement: 'Hex.decode' } },
        { messageId: 'decode', data: { native: 'Uint8Array.fromBase64', replacement: 'Base64.decode' } },
        { messageId: 'decode', data: { native: 'Uint8Array.fromBase64', replacement: 'Base64Url.decode' } },
      ],
    },
  ],
});

import { preferEffectCsv } from '../../../src/rules/effect/prefer-effect-csv';
import { createRuleTester } from '../../rule-tester';

const tester = createRuleTester();

const imports = `
  import * as Arr from 'effect/Array'
  import * as Effect from 'effect/Effect'
  import * as Fn from 'effect/Function'
  import * as Str from 'effect/String'
`;

function invalid(code: string, messageId: 'decode' | 'encode') {
  return { code: `${imports}\n${code}`, errors: [{ messageId }] };
}

tester.run('prefer-effect-csv', preferEffectCsv, {
  valid: [
    // Not an Effect file.
    String.raw`const rows = text.split('\n').map((line) => line.split(','))`,
    `${imports}
      const scopes = Arr.filter(Str.split(token.scope, ','), Str.isNonEmpty)
      const parseScopes = Fn.flow(Str.split(','), Arr.map(Str.trim), Arr.filter(Str.isNonEmpty))
      const reasons = Str.split(',')(Arr.headNonEmpty(Str.split(':')(reason)))
      const key = Arr.join([account, costCenter, vatCode], '|')
      const scope = Arr.join(scopes, ',')
      const message = Arr.join(Arr.map(errors, (error) => error.message), ', ')
      const report = rows.map((row) => row.join(', ')).join('\\n')
      const words = Str.split(text, '\\n').map((line) => line.split(' '))
      const translations = Arr.map(Str.split(raw, '\\n'), (line) => Str.split(line, '||'))
      const sizes = files.map((file) => file.split('\\n').length).map((size) => size.split(','))
      const fields = text.split('\\n').map((line) => line.replace(prefix, '')).map((line) => line.split(','))
      const quoted = rows.map((row) => row.join(',')).map((line) => \`"\${line}"\`).join('\\n')
      const firstNames = members.map((member) => member.name.split(','))
    `,
    `${imports}
      for (const entry of entries) {
        const [code, detail] = entry.split(',')
      }
    `,
  ],
  invalid: [
    invalid(
      String.raw`const rows = Fn.pipe(text, Str.split('\n'), Arr.map(Str.trim), Arr.take(10), Arr.map(Str.split(',')))`,
      'decode',
    ),
    invalid(String.raw`const body = [header, ...rows.map((row) => row.join(',')).toReversed()].join('\n')`, 'encode'),
    invalid(String.raw`const rows = text.split('\n').map((line) => line.split(','))`, 'decode'),
    invalid(String.raw`const rows = text.trim().split(/\r?\n/).map((line) => line.trim().split(';'))`, 'decode'),
    invalid(String.raw`const rows = Arr.map(Str.split(text, '\n'), (line) => Str.split(line, '\t'))`, 'decode'),
    invalid(String.raw`const rows = Fn.pipe(text, Str.split('\n'), Arr.map(Str.split(',')))`, 'decode'),
    invalid(
      "const lines = text.split('\\r\\n')\nfor (const line of lines) {\n  cells.push(line.split(','))\n}",
      'decode',
    ),
    invalid(String.raw`const body = rows.map((row) => row.join(',')).join('\n')`, 'encode'),
    invalid(String.raw`const body = [header, ...rows.map((row) => row.join(';'))].join('\r\n')`, 'encode'),
    invalid(String.raw`const body = Arr.join(Arr.map(rows, Arr.join(',')), '\n')`, 'encode'),
    invalid(String.raw`const body = rows.pipe(Arr.map((row) => Arr.join(row, '\t')), Arr.join('\n'))`, 'encode'),
  ],
});

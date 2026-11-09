import { preferEffectCookies } from '../../../src/rules/effect/prefer-effect-cookies';
import { testRule } from '../../rule-tester';

const valid = `
  import { Cookies, HttpServerRequest } from 'effect/http'
  import * as Str from 'effect/String'
  const fixture = 'a=1; Path=/; HttpOnly'
  const fixtures = ['a=1; Path=/', 'b=2; Path=/admin']
  headers.append('set-cookie', 'a=1; Path=/')
  const passthrough = Headers.set(headers, 'set-cookie', Arr.join(response.headers.getSetCookie(), ', '))
  const denied = hopByHop.has('set-cookie')
  const session = request.cookies['session'] !== undefined
  const parsed = Cookies.parseHeader(request.headers.cookie ?? '')
  const mediaType = contentType.split(';')
  const secure = Str.includes('Secure')(description)
  const message = \`Cookie \${name} expired; please sign in again\`
`;

for (const [invalid, messageId] of [
  ['const theme = document.cookie', 'documentCookie'],
  ["document.cookie = 'theme=dark'", 'documentCookie'],
  ["const pairs = request.headers.cookie.split('; ')", 'parseCookies'],
  ["const pairs = headers.get('Cookie')?.split(';')", 'parseCookies'],
  ["const pairs = (cookieHeader ?? '').split(';')", 'parseCookies'],
  [String.raw`const token = /(?:^|;\s*)token=([^;]*)/.exec(cookieHeader)`, 'parseCookies'],
  [`const header = \`\${name}=\${value}; Path=/; HttpOnly\``, 'serializeCookie'],
  ["const header = 'session=' + token + '; Max-Age=3600'", 'serializeCookie'],
  ["const secure = Fn.pipe(cookie, Str.includes('; Secure'))", 'inspectCookie'],
  ["const httpOnly = String(response.headers.get('set-cookie')).includes('HttpOnly')", 'inspectCookie'],
] as const) {
  testRule('prefer-effect-cookies', preferEffectCookies, {
    valid,
    invalid: `
      import * as Str from 'effect/String'
      ${invalid}
    `,
    messageId,
  });
}

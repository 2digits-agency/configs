import { preferEffectHeaders } from '../../../src/rules/effect/prefer-effect-headers';
import { testRule } from '../../rule-tester';

const valid = `
  import { Headers, HttpClientRequest, HttpClientResponse, HttpServerResponse } from 'effect/http'
  import * as Arr from 'effect/Array'
  const headers = Headers.fromInput({ authorization: 'secret' })
  const next = HttpClientResponse.link(response, 'next')
  const links = Headers.parseLink(response.headers.link ?? '')
  const link = Headers.formatLink([{ target: url, rel: ['next'] }])
  const vary = Headers.append(headers, 'vary', 'Accept')
  const fixture = '</items?page=2>; rel="next"'
  const forwarded = Headers.set(headers, 'link', upstream.headers.get('link') ?? '')
  const cookies = Headers.set(headers, 'set-cookie', \`\${headers['set-cookie']}, \${cookie}\`)
  const other = HttpClientRequest.setHeader(request, 'accept', \`\${request.headers['content-type']}, text/plain\`)
  const label = \`<\${name}> is required\`
  const permalinks = permalink.split('/')
  const stylesheet = html.includes('rel="stylesheet"')
  const merged = HttpServerResponse.setHeader(response, 'vary', Arr.join(values, ', '))
  const copied = HttpServerResponse.setHeader(response, 'vary', upstream.headers.vary + ', Accept')
  const piped = Headers.set('vary', headers.get('vary') + ', Accept')
  const cookie = Headers.set(headers, 'cookie', headers.cookie + '; theme=dark')
  const semicolons = Headers.set(headers, 'x-tags', headers.get('x-tags') + '; beta')
  const hasNext = html.includes('rel="next"')
  const nextPage = /rel="next"/.test(body)
  const isSecure = url.searchParams.get('link')?.startsWith('https')
  const linkParts = params.get('link')?.split(',')
  const sites = Reflect.get(config, 'link').split(',')
`;

for (const [invalid, messageId] of [
  ["const parts = response.headers.get('Link')?.split(',')", 'parseLink'],
  ["const parts = (linkHeader ?? '').split(', ')", 'parseLink'],
  [String.raw`const next = /<([^>]+)>;\s*rel="next"/.exec(linkHeader)`, 'parseLink'],
  ['const next = /<([^>]+)>/.exec(response.headers.link)', 'parseLink'],
  [`const isNext = response.headers.get('link')?.includes('rel="next"')`, 'parseLink'],
  [`const link = \`<\${url}>; rel="next"\``, 'formatLink'],
  [`const link = '<' + url + '>; rel="next"'`, 'formatLink'],
  [`const next = Headers.set(headers, 'vary', \`\${headers.vary}, Accept\`)`, 'appendHeader'],
  ["const next = Headers.set(headers, 'Vary', Headers.get(headers, 'vary') + ', Accept')", 'appendHeader'],
  [
    "const next = Headers.set(current, 'vary', Option.getOrElse(Headers.get(current, 'vary'), () => '') + ', Accept')",
    'appendHeader',
  ],
  [
    "const next = HttpServerResponse.setHeader(response, 'cache-control', [response.headers['cache-control'], 'no-store'].join(', '))",
    'appendHeader',
  ],
] as const) {
  testRule('prefer-effect-headers', preferEffectHeaders, {
    valid,
    invalid: `
      import { Headers, HttpServerResponse } from 'effect/http'
      ${invalid}
    `,
    messageId,
  });
}

testRule('prefer-effect-headers', preferEffectHeaders, {
  valid,
  invalid: `
    import * as Effect from 'effect/Effect'
    const headers = new Headers({ authorization: 'secret' })
  `,
  messageId: 'effectHeaders',
});

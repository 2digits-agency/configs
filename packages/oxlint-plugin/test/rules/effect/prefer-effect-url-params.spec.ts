import { preferEffectUrlParams } from '../../../src/rules/effect/prefer-effect-url-params';
import { testRule } from '../../rule-tester';

const valid = `
  import { HttpClientRequest, UrlParams } from 'effect/http'
  const request = HttpClientRequest.get(\`\${base}/tags\`).pipe(HttpClientRequest.setUrlParam('search', query))
  const params = UrlParams.fromInput(new URLSearchParams(location.search))
  const form = new URLSearchParams(bodyText)
  const path = \`/users/\${id}\`
  const hint = \`Paste \${redirectUri}?code=… here\`
  const query = sql\`select * from logs where path = '/search?q=\${term}'\`
`;

for (const [invalid, messageId] of [
  [`HttpClientRequest.get(\`\${base}/tags?search=\${encodeURIComponent(query)}\`)`, 'manualQuery'],
  [`HttpClientRequest.get(\`\${base}/contacts?filters%5Bemail%5D=\${encodeURIComponent(email)}\`)`, 'manualQuery'],
  [`\`\${root}/photo?maxwidth=400&photo_reference=\${reference}\``, 'manualQuery'],
  ["'/users?page=' + page", 'manualQuery'],
  ["base + '&sort=' + sort", 'manualQuery'],
  ["new URLSearchParams({ place_id: placeId, language: 'nl' })", 'urlSearchParams'],
  ['new URLSearchParams()', 'urlSearchParams'],
] as const) {
  testRule('prefer-effect-url-params', preferEffectUrlParams, {
    valid,
    invalid: `
      import { HttpClientRequest } from 'effect/http'
      const value = ${invalid}
    `,
    messageId,
  });
}

// Tests build raw wire URLs and form bodies on purpose.
testRule('prefer-effect-url-params', preferEffectUrlParams, {
  valid: `
    import { HttpClient } from 'effect/http'
    const response = HttpClient.get(\`\${url}/workflow?id=\${workflowId}\`)
    const form = new URLSearchParams({ code: 'x' })
  `,
  validFilename: 'routes.spec.ts',
  invalid: `
    import { HttpClient } from 'effect/http'
    const response = HttpClient.get(\`\${url}/workflow?id=\${workflowId}\`)
  `,
  messageId: 'manualQuery',
});

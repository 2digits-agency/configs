import { describe, expect, it } from 'vite-plus/test';

import { gatewayConnection, gatewayUrl } from '../executor/connection.js';

describe('executor gateway connection', () => {
  const endpoint = 'https://tlo.example123.opentunnel.xyz/mcp';

  const token = 'a'.repeat(64);

  it.for(['https://tlo.example123.opentunnel.xyz', 'https://tlo.example123.opentunnel.xyz/', endpoint, `${endpoint}/`])(
    'normalizes %s to the MCP endpoint',
    (url) => {
      expect(gatewayUrl(url)).toBe(endpoint);
    },
  );

  it.for([
    // eslint-disable-next-line unicorn/prefer-https -- verifies plain HTTP is rejected
    'http://tlo.example123.opentunnel.xyz/mcp',
    'https://example.com/mcp',
    'https://tlo.example123.opentunnel.xyz.evil.test/mcp',
    'https://tlo.example123.opentunnel.xyz@evil.test/mcp',
    'https://user:secret@tlo.example123.opentunnel.xyz/mcp',
    'https://tlo.example123.opentunnel.xyz:443/mcp',
    'https://tlo.example123.opentunnel.xyz/other',
    `${endpoint}?token=secret`,
    `${endpoint}#fragment`,
    `${endpoint}\n`,
    'https://127.0.0.1/mcp',
    'https://example123.opentunnel.xyz/mcp',
  ])('rejects unsafe or unexpected destination %s', (url) => {
    expect(() => gatewayConnection({ fields: { url, token } })).toThrow('Enter the HTTPS OpenTunnel URL');
  });

  it('uses the gateway key only in the bearer header', () => {
    expect(gatewayConnection({ fields: { url: endpoint, token } })).toStrictEqual({
      url: endpoint,
      headers: { Authorization: `Bearer ${token}` },
    });
  });

  it.for(['', 'a'.repeat(63), 'a'.repeat(65), 'A'.repeat(64), `${token}\n`, 'not-a-gateway-key'])(
    'rejects malformed gateway keys without exposing them',
    (key) => {
      expect(() => gatewayConnection({ fields: { url: endpoint, token: key } })).toThrow(
        new Error('Enter the 64-character gateway.key value, not an Orbit token or OpenTunnel identity key.'),
      );
    },
  );
});

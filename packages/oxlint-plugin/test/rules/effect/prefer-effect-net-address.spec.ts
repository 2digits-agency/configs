import { preferEffectNetAddress } from '../../../src/rules/effect/prefer-effect-net-address';
import { createRuleTester } from '../../rule-tester';

const tester = createRuleTester();

const effect = "import * as Effect from 'effect/Effect'\nimport * as Str from 'effect/String'\n";

tester.run('prefer-effect-net-address', preferEffectNetAddress, {
  valid: [
    "import { isIP } from 'node:net'\nconst local = isIP(host) === 4 && host.startsWith('127.')",
    `${effect}const semver = /^\\d+\\.\\d+\\.\\d+$/u`,
    `${effect}const id = /^(?:0|[1-9]\\d*)$/u\nconst money = /^(?:0|[1-9]\\d*)(?:\\.\\d+)?$/u`,
    `${effect}const byte = /^(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)$/u\nconst rgb = /^rgb\\((?:25[0-5]|2[0-4]\\d|1?\\d?\\d),/u`,
    `${effect}const local = hostname === 'localhost' || Str.endsWith('.local')(hostname)`,
    `${effect}const host = Config.String('HOST').pipe(Config.withDefault('127.0.0.1'))`,
    `${effect}const [lineItemId] = Str.split(':')(marker)`,
    `${effect}const index = marker.lastIndexOf(':')`,
    `${effect}import { createServer } from 'node:net'\nconst server = createServer()`,
    `${effect}const isIP = (value: string) => value.length > 0\nconst ok = isIP(host)`,
  ],
  invalid: [
    {
      code: `${effect}import { isIP } from 'node:net'\nconst family = isIP(host)`,
      errors: [{ messageId: 'nodeIpCheck', data: { name: 'isIP' } }],
    },
    {
      code: `${effect}import * as net from 'net'\nconst v4 = net.isIPv4(host)`,
      errors: [{ messageId: 'nodeIpCheck', data: { name: 'isIPv4' } }],
    },
    {
      code: `${effect}import ipaddr from 'ipaddr.js'`,
      errors: [{ messageId: 'library', data: { source: 'ipaddr.js' } }],
    },
    {
      code: `${effect}const ipv4 = /^(\\d{1,3}\\.){3}\\d{1,3}$/u`,
      errors: [{ messageId: 'ipText' }],
    },
    {
      code: `${effect}const loopback = hostname.startsWith('127.')`,
      errors: [{ messageId: 'ipText' }],
    },
    {
      code: `${effect}const reserved = /^(?:0|10|127)\\./u`,
      errors: [{ messageId: 'ipText' }],
    },
    {
      code: `${effect}const strict = /^(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)$/u`,
      errors: [{ messageId: 'ipText' }],
    },
    // One hand-written classifier is one finding per top-level statement, however many patterns it holds.
    {
      code: `${effect}
        const BLOCKED_IPV4 = [/^10\\./u, /^127\\./u, /^172\\.(?:1[6-9]|2\\d|3[01])\\./u, /^192\\.168\\./u]
        const BLOCKED_MAPPED = [/^::ffff:7f[\\da-f]{2}:/u]
        function isBlockedIpv6(hostname: string) {
          return hostname === '::' || hostname === '::1' || /^fe[89ab][\\da-f]:/u.test(hostname) || /^(?:fc|fd)[\\da-f]{2}:/u.test(hostname)
        }
        const isLiteral = (hostname: string) => /^\\d+\\.\\d+\\.\\d+\\.\\d+$/u.test(hostname)
      `,
      errors: [{ messageId: 'ipText' }, { messageId: 'ipText' }, { messageId: 'ipText' }, { messageId: 'ipText' }],
    },
  ],
});

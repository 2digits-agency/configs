import { defineProvider, object, plain, secrets, string } from 'apps';
import { mcpHealth } from 'apps/mcp';

import { gatewayConnection } from './connection.js';

export const service = defineProvider({
  name: 'Teamleader Orbit gateway',
  // Tunnel hosts contain two dynamic labels. Executor's single-label host wildcards cannot cover them;
  // Validate every destination with gatewayConnection before the app uses the secret.
  auth: {
    apiKey: secrets({
      label: 'OpenTunnel URL + gateway key',
      fields: object({ url: plain(string({ minLength: 1 })), token: string({ minLength: 64 }) }),
    }),
  },
  health: (check) => mcpHealth(check, gatewayConnection(check.account)),
});

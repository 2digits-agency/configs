import { accountRouter, defineApp, toolAnnotations, withApprovals } from 'apps';
import { mcpRouter } from 'apps/mcp';
import { always } from 'apps/operations/approval';

import { gatewayConnection } from './connection.js';
import { service } from './provider.js';

export default defineApp({ accounts: { service: service.many() } }, async ({ accounts, cache, signal }) => ({
  tools: await accountRouter(
    accounts.service,
    async (account) =>
      withApprovals(await mcpRouter({ ...gatewayConnection(account), account, cache, signal }), (tool) => {
        const hints = toolAnnotations(tool);

        return hints?.readOnlyHint === true && hints.destructiveHint !== true ? undefined : always();
      }),
    { signal },
  ),
}));

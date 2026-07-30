import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { tegami } from 'tegami';
import { runCli } from 'tegami/cli';
import { github } from 'tegami/plugins/github';

const paper = tegami({
  npm: {
    client: 'pnpm',
    onBreakPeerDep: 'set',
    trustedPublish: {
      provider: 'github',
      workflow: 'release.yml',
    },
    updateLockFile: true,
  },
  cwd: path.resolve(fileURLToPath(import.meta.url), '../../'),
  plugins: [
    github({
      repo: '2digits-agency/configs',
      versionPr: {
        base: 'main',
      },
      createTags: true,
      release: true,
    }),
  ],
});

if (import.meta.main) {
  await runCli(paper);
}

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
  plugins: [
    github({
      repo: '2digits-agency/configs',
      versionPr: {
        base: 'main',
      },
    }),
  ],
});

await runCli(paper);

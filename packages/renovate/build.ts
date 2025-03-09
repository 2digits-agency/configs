import { readFile, writeFile } from 'node:fs/promises';

import { allPackages } from 'nolyfill';

import type Nolyfill from './src/nolyfill.json';

type NolyfillConfig = typeof Nolyfill;

async function main() {
  const nolyfillConfig = await readFile('./src/nolyfill.json', 'utf8');
  const nolyfill = JSON.parse(nolyfillConfig) as NolyfillConfig;

  nolyfill.packageRules = [{ groupName: 'Nolyfill', matchPackageNames: allPackages }];

  await writeFile('./src/nolyfill.json', `${JSON.stringify(nolyfill, undefined, 2)}\n`);
}

await main();

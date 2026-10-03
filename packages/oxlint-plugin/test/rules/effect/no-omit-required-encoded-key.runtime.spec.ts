import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const fixture = fileURLToPath(new URL('../../fixtures/omit-required-encoded-key.mjs', import.meta.url));

describe('required primitive encoded keys', () => {
  it.for([
    ['effect', '4.0.0'],
    ['effect-rc117', '4.0.0-rc.117'],
  ] as const)('verifies required and optional String/Number/Boolean encoding on %s@%s', ([packageName, version]) => {
    // Execute the same public-API fixture on each real version without mixing their nominal TypeScript types.
    const result = spawnSync(process.execPath, [fixture, packageName, version], { encoding: 'utf8' });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toStrictEqual([
      { primitive: 'String', decoded: { b: 'hello' }, missingKey: ['b'], optional: {} },
      { primitive: 'Number', decoded: { b: 42 }, missingKey: ['b'], optional: {} },
      { primitive: 'Boolean', decoded: { b: true }, missingKey: ['b'], optional: {} },
    ]);
  });
});

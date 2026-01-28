import { existsSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { buildTokens } from '../src/index.js';

const FIXTURES_DIR = path.join(__dirname, '../fixtures');
const OUTPUT_DIR = path.join(__dirname, '../.test-output');

describe('buildTokens', () => {
  afterEach(() => {
    if (existsSync(OUTPUT_DIR)) {
      rmSync(OUTPUT_DIR, { recursive: true });
    }
  });

  it('generates tailwind.config.ts from fixture tokens', async () => {
    await buildTokens({
      lightModeTokens: path.join(FIXTURES_DIR, 'Light mode.tokens.json'),
      mobileTokens: path.join(FIXTURES_DIR, 'Mobile.tokens.json'),
      desktopTokens: path.join(FIXTURES_DIR, 'Desktop.tokens.json'),
      outputDir: OUTPUT_DIR,
    });

    const configPath = path.join(OUTPUT_DIR, 'tailwind.config.ts');

    expect(existsSync(configPath)).toBe(true);

    const content = await readFile(configPath, 'utf8');

    expect(content).toContain('import type { Config }');
    expect(content).toContain('satisfies Partial<Config>');
  });

  it('generates tokens.css from fixture tokens', async () => {
    await buildTokens({
      lightModeTokens: path.join(FIXTURES_DIR, 'Light mode.tokens.json'),
      mobileTokens: path.join(FIXTURES_DIR, 'Mobile.tokens.json'),
      desktopTokens: path.join(FIXTURES_DIR, 'Desktop.tokens.json'),
      outputDir: OUTPUT_DIR,
    });

    const cssPath = path.join(OUTPUT_DIR, 'tokens.css');

    expect(existsSync(cssPath)).toBe(true);

    const content = await readFile(cssPath, 'utf8');

    expect(content).toContain(':root {');
  });

  it('extracts hex colors from Figma color objects', async () => {
    await buildTokens({
      lightModeTokens: path.join(FIXTURES_DIR, 'Light mode.tokens.json'),
      mobileTokens: path.join(FIXTURES_DIR, 'Mobile.tokens.json'),
      desktopTokens: path.join(FIXTURES_DIR, 'Desktop.tokens.json'),
      outputDir: OUTPUT_DIR,
    });

    const content = await readFile(path.join(OUTPUT_DIR, 'tailwind.config.ts'), 'utf8');

    expect(content).toContain('#FFF1F2');

    expect(content).toMatchSnapshot();
  });
});

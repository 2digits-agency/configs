#!/usr/bin/env node
import path from 'node:path';

import { buildTokens } from './config.js';

interface CliArgs {
  lightMode: string;
  mobile: string;
  desktop: string;
  output: string;
  breakpoint: string;
}

function parseArgs(args: Array<string>): CliArgs {
  const result: Partial<CliArgs> = {
    breakpoint: '768px',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--light-mode':
      case '-l': {
        result.lightMode = next;
        i++;
        break;
      }
      case '--mobile':
      case '-m': {
        result.mobile = next;
        i++;
        break;
      }
      case '--desktop':
      case '-d': {
        result.desktop = next;
        i++;
        break;
      }
      case '--output':
      case '-o': {
        result.output = next;
        i++;
        break;
      }
      case '--breakpoint':
      case '-b': {
        result.breakpoint = next;
        i++;
        break;
      }
      case '--help':
      case '-h': {
        printHelp();
        process.exit(0);
      }
    }
  }

  if (!result.lightMode || !result.mobile || !result.desktop || !result.output) {
    console.error('Error: Missing required arguments\n');
    printHelp();
    process.exit(1);
  }

  return result as CliArgs;
}

function printHelp(): void {
  console.log(String.raw`
Usage: design-tokens [options]

Options:
  -l, --light-mode <path>  Path to light mode tokens JSON
  -m, --mobile <path>      Path to mobile tokens JSON
  -d, --desktop <path>     Path to desktop tokens JSON
  -o, --output <dir>       Output directory
  -b, --breakpoint <size>  Responsive breakpoint (default: 768px)
  -h, --help               Show this help message

Example:
  design-tokens \
    --light-mode "Light mode.tokens.json" \
    --mobile Mobile.tokens.json \
    --desktop Desktop.tokens.json \
    --output ./src/styles
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();

  console.log('Building design tokens...');

  await buildTokens({
    lightModeTokens: path.resolve(cwd, args.lightMode),
    mobileTokens: path.resolve(cwd, args.mobile),
    desktopTokens: path.resolve(cwd, args.desktop),
    outputDir: path.resolve(cwd, args.output),
    breakpoint: args.breakpoint,
  });

  console.log(`Done! Output written to ${args.output}`);
}

main().catch((error: unknown) => {
  console.error('Failed to build tokens:', error);
  process.exit(1);
});

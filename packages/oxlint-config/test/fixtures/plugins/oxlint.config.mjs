import { twoDigits } from '../../../dist/index.mjs';

// The built preset with every JS plugin integration on and the type-aware integrations off.
export default twoDigits({
  depend: true,
  drizzle: true,
  next: true,
  react: false,
  storybook: true,
  tailwind: { cssConfigPath: 'tailwind.css' },
  tanstackQuery: true,
  tanstackRouter: true,
  ts: false,
  turbo: true,
  vitest: false,
  zod: false,
});

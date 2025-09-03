# Agent Guidelines for @2digits/configs

## Build/Lint/Test Commands

- **Build all packages**: `turbo run build` or `pnpm build`
- **Run all tests**: `turbo test` or `pnpm test` (uses Vitest)
- **Run single test**: `vitest --run` (in package directory)
- **Lint all**: `pnpm lint` (ESLint + manypkg)
- **Type check**: `turbo types` or `pnpm types`
- **Format check**: `pnpm format` (Prettier)
- **Full check**: `pnpm check` (test + lint + types + format + knip)
- **Fix linting**: `pnpm lint:fix`
- **Fix formatting**: `pnpm format:fix`

## Code Style Guidelines

### TypeScript

- Target: ES2022, Modules: ESNext with Bundler resolution
- Strict mode enabled, no implicit returns/overrides
- JSX: react-jsx transform
- No unused locals/parameters, strict typing
- Verbatim module syntax, erasable syntax only

### Imports

- Built-ins → React → Next.js → Expo → Third-party → @2digits → @/ → Scoped → JSON → Relative
- Use single quotes, trailing commas
- Import order enforced via @ianvs/prettier-plugin-sort-imports

### Formatting

- Print width: 120, bracketSameLine: true
- Single quotes, trailing commas: all
- Experimental operator position: start

### Linting

- ESLint with TypeScript, React, Unicorn, SonarJS, and more
- Comprehensive rules for code quality and consistency
- Uses @2digits/eslint-config with framework-specific options

### Testing

- Vitest framework with --run flag for CI
- Snapshot testing for fixtures
- Timeout handling for long-running tests

### Building

- tsdown for TypeScript compilation and minification
- ESM output with .mjs/.d.mts extensions
- Side-effect free packages

### Error Handling

- Use TypeScript strict mode for compile-time safety
- ESLint catches potential runtime errors
- Knip for unused dependency detection

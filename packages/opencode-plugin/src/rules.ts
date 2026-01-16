// Rules are bundled as string constants to avoid runtime file loading
// This gets compiled into the bundle at build time

const BASE_RULES = `## Code Quality Standards

- Make minimal, surgical changes
- Never compromise type safety: No any, no non-null assertion operator (!), no type assertions (as Type)
- Make illegal states unrepresentable: Model domain with ADTs/discriminated unions; parse inputs at boundaries into typed structures; if state can't exist, code can't mishandle it
- Abstractions: Consciously constrained, pragmatically parameterised, doggedly documented

## Patterns to Avoid

- Premature optimization
- Magic strings/numbers without constants
- Nested ternaries beyond 2 levels
- Barrel files (index.ts re-exports) in large modules

## ENTROPY REMINDER

This codebase will outlive you. Every shortcut you take becomes someone else's burden. Every hack compounds into technical debt that slows the whole team down.

You are not just writing code. You are shaping the future of this project. The patterns you establish will be copied. The corners you cut will be cut again.

Fight entropy. Leave the codebase better than you found it.`;

const EFFECT_RULES = `## Effect Patterns

- Use Effect.gen for readable sequential composition
- Define tagged errors with Schema.TaggedError (not Data.TaggedError)
- Services use Context.Tag class pattern: \`class Foo extends Context.Tag("@app/Foo")<Foo, Interface>() {}\`
- Always use Effect.fn for traceable service methods
- Prefer Layer.effect for service construction, Layer.succeed for simple values
- Use HttpClient.filterStatusOk to convert non-2xx to ResponseError
- Always call Effect.scoped after consuming response body`;

const REACT_RULES = `## React/Next.js Patterns

- Prefer Server Components by default, use 'use client' only when needed
- Colocate data fetching with components that use it
- Use Suspense boundaries for loading states
- Prefer controlled components with explicit state management
- Extract complex logic into custom hooks
- Name useState pairs as [value, setValue]`;

export function loadRules(): string {
  return [BASE_RULES, EFFECT_RULES, REACT_RULES].join('\n\n');
}

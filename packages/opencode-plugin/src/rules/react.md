## React/Next.js Patterns

- Prefer Server Components by default, use 'use client' only when needed
- Colocate data fetching with components that use it
- Use Suspense boundaries for loading states
- Prefer controlled components with explicit state management
- Extract complex logic into custom hooks
- Name useState pairs as [value, setValue]

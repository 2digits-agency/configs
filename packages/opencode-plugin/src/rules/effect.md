## Effect Patterns

- Use Effect.gen for readable sequential composition
- Define tagged errors with Schema.TaggedError (not Data.TaggedError)
- Services use Context.Tag class pattern: \`class Foo extends Context.Tag("@app/Foo")<Foo, Interface>() {}\`
- Always use Effect.fn for traceable service methods
- Prefer Layer.effect for service construction, Layer.succeed for simple values
- Use HttpClient.filterStatusOk to convert non-2xx to ResponseError
- Always call Effect.scoped after consuming response body

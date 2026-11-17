---
packages:
  '@2digits/oxlint-plugin': patch
---

### Compile Schema guards with the Effect JIT compiler

The plugin now enables `effect/schema/SchemaJITCompiler`, so the Schema guards and decoders in its rules compile to JavaScript on first use. If the runtime blocks `new Function`, they keep using the interpreter.

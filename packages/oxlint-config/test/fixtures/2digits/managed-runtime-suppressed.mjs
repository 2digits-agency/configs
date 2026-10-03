import * as ManagedRuntime from 'effect/ManagedRuntime';

// oxlint-disable-next-line 2digits/require-managed-runtime-disposal -- Intentional process lifetime, no shutdown teardown.
const runtime = ManagedRuntime.make(layer);
export const run = (program) => runtime.runPromise(program);

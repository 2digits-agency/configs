import * as ManagedRuntime from 'effect/ManagedRuntime';

const runtime = ManagedRuntime.make(layer);
export const run = (program) => runtime.runPromise(program);

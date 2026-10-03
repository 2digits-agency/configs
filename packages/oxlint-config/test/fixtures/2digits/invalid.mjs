import * as Config from 'effect/Config';
import * as Schema from 'effect/Schema';

export const AnyObject = Schema.Struct({});
export const FunctionConfig = Config.withDefault(Config.succeed(() => 1), () => 2);
export const PipedFunctionConfig = Config.succeed(() => 1).pipe(Config.withDefault(() => 2));
export const NumberConfig = Config.withDefault(Config.Number('N'), () => 2);
export const StringConfig = Config.String('S').pipe(Config.withDefault(() => 'fallback'));

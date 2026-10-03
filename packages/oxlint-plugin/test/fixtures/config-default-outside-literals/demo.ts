import * as Config from 'effect/Config';
import * as Schema from 'effect/Schema';

export const typo = Config.schema(Schema.Literals(['debug', 'info']), 'LEVEL').pipe(Config.withDefault('inof'));
export const corrected = Config.schema(Schema.Literals(['debug', 'info']), 'LEVEL').pipe(Config.withDefault('info'));
export const sentinel = Config.schema(Schema.Literals(['debug', 'info']), 'LEVEL').pipe(Config.withDefault(null));
export const widened: Config.Config<'debug' | 'info' | 'legacy'> = Config.Literals(['debug', 'info'], 'LEVEL').pipe(
  Config.withDefault('legacy'),
);
export const broadDefault = Config.Literals(['debug', 'info'], 'LEVEL').pipe(Config.withDefault('legacy' as string));

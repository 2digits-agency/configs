import * as Schema from 'effect/Schema';

export const AnyObject = Schema.Struct({});

const map = new Map([[{ id: 7 }, 'stored']]);

export const missing = map.get({ id: 7 });

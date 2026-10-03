import * as Layer from 'effect/Layer';

const make = () => Layer.succeed(Service, {});
export const graph = Layer.merge(make(), make());

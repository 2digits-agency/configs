import * as Layer from 'effect/Layer';

const make = () => Layer.succeed(Service, {});
// oxlint-disable-next-line 2digits/no-duplicate-fresh-layer-factory -- Two isolated instances are intentional.
export const graph = Layer.merge(make(), make());

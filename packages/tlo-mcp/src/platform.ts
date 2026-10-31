import * as NodeCrypto from '@effect/platform-node/NodeCrypto';
import * as NodeServices from '@effect/platform-node/NodeServices';
import * as Layer from 'effect/Layer';

// NodeServices no longer includes crypto; keep application and test runtimes aligned.
export const PlatformLive = Layer.mergeAll(NodeServices.layer, NodeCrypto.layerDigest, NodeCrypto.layerSecureRandom);

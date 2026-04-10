import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import type { Umi } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';

const umiCache = new Map<string, Umi>();

export function getUmi(rpcEndpoint: string): Umi {
    let umi = umiCache.get(rpcEndpoint);
    if (!umi) {
        umi = createUmi(rpcEndpoint).use(mplTokenMetadata());
        umiCache.set(rpcEndpoint, umi);
    }
    return umi;
}

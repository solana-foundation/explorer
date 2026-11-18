import { Cluster } from '@utils/cluster';

import { ChainId } from './chain-id';
import { GENESIS_HASHES, type GenesisHash } from './const';

function getChainIdFromGenesisHash(genesisHash: GenesisHash): ChainId | undefined {
    switch (genesisHash) {
        case GENESIS_HASHES.MAINNET:
            return ChainId.MAINNET;
        case GENESIS_HASHES.DEVNET:
            return ChainId.DEVNET;
        case GENESIS_HASHES.TESTNET:
            return ChainId.TESTNET;
        default:
            return undefined;
    }
}

export function getChainId(cluster: Cluster, genesisHash?: GenesisHash): ChainId | undefined {
    switch (cluster) {
        case Cluster.Mainnet:
            return ChainId.MAINNET;
        case Cluster.Testnet:
            return ChainId.TESTNET;
        case Cluster.Devnet:
            return ChainId.DEVNET;
        case Cluster.Custom:
            return genesisHash ? getChainIdFromGenesisHash(genesisHash) : undefined;
        default:
            return undefined;
    }
}

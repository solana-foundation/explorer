import { address, createSolanaRpc, mainnet } from '@solana/kit';
import { fetchMetadataFromSeeds, unpackAndFetchData } from '@solana-program/program-metadata';

import { normalizeUnknownError } from '@/app/shared/unknown-error';
import { Cluster } from '@/app/utils/cluster';

export const errors = {
    422: 'JSON parse failed',
    500: 'Metadata fetch failed',
    501: 'Cluster is not supported',
};

/// Method to fetch metadata for the address on the mainnet
async function getProgramMetadataIdlOnMainnet(programAddress: string, url: string) {
    const rpc = createSolanaRpc(mainnet(url));
    let metadata;

    try {
        metadata = await fetchMetadataFromSeeds(rpc, {
            authority: null,
            program: address(programAddress),
            seed: 'idl',
        });
    } catch (error) {
        throw normalizeUnknownError(error, errors[500]);
    }
    try {
        const content = await unpackAndFetchData({ rpc, ...metadata.data });
        const parsed = JSON.parse(content);
        return parsed;
    } catch (error) {
        throw new Error(errors[422]);
    }
}

// Export functions in an object so they can be mocked
export const programMetadataIdlFunctions = {
    getProgramMetadataIdlOnMainnet,
};

/// Handle Idl fetching
// - should fetch metadata for the mainnet cluster
// - should fail for all other clusters, except custom
// - should work for custom cluster as it may reference the mainnet
export async function getProgramMetadataIdl(programAddress: string, url: string, cluster?: Cluster) {
    if (cluster === undefined || !(cluster === Cluster.MainnetBeta || cluster === Cluster.Custom)) {
        throw new Error(errors[501]);
    }

    return programMetadataIdlFunctions.getProgramMetadataIdlOnMainnet(programAddress, url);
}

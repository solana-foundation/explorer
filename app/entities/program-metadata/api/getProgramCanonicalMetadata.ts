import { address, createSolanaRpc, mainnet } from '@solana/kit';
import { fetchMetadataFromSeeds, unpackAndFetchData } from '@solana-program/program-metadata';

import { normalizeUnknownError } from '@/app/shared/unknown-error';

/**
 * Method to fetch PMP' metadata by seed
 * We construct rpc but address is meant to be on the mainnet
 * NOTE: should use invariant to prevent requests for other cluster, but handle this outside the module atm
 */
export async function getProgramCanonicalMetadata(programAddress: string, seed: string, url: string) {
    // NOTE: previously we used mainnet() to ensure url for Mainnet, but that is against the current logic for security.txt
    const rpc = createSolanaRpc(mainnet(url));
    let metadata;

    try {
        metadata = await fetchMetadataFromSeeds(rpc, {
            authority: null,
            program: address(programAddress),
            seed,
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

export const IDL_SEED = 'idl';
export async function getProgramMetadataIdl(programAddress: string, url: string) {
    return getProgramCanonicalMetadata(programAddress, IDL_SEED, url);
}

export const SECURITY_TXT_SEED = 'security';
export async function getProgramMetadataSecurityTxt(programAddress: string, url: string) {
    return getProgramCanonicalMetadata(programAddress, SECURITY_TXT_SEED, url);
}

export const errors = {
    422: 'JSON parse failed',
    500: 'Metadata fetch failed',
    501: 'Cluster is not supported',
};

import { address, createSolanaRpc, mainnet } from '@solana/kit';
import { fetchMetadataFromSeeds, unpackAndFetchData } from '@solana-program/program-metadata';

export async function getProgramCanonicalMetadata(programAddress: string, seed: string, url: string) {
    const rpc = createSolanaRpc(mainnet(url));
    let metadata;

    try {
        metadata = await fetchMetadataFromSeeds(rpc, {
            authority: null,
            program: address(programAddress),
            seed,
        });
    } catch (error) {
        console.error('Metadata fetch failed', error);
        throw new Error('Metadata fetch failed');
    }
    try {
        const content = await unpackAndFetchData({ rpc, ...metadata.data });
        const parsed = JSON.parse(content);
        return parsed;
    } catch (error) {
        throw new Error('JSON parse failed');
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

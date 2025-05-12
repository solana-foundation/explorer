import { fetchMetadataFromSeeds, unpackAndFetchData } from '@solana-program/program-metadata';
import { address, createSolanaRpc, mainnet } from 'web3js-experimental';

export async function getCodamaIdl(programAddress: string, url: string) {
    const rpc = createSolanaRpc(mainnet(url));
    let metadata;

    try {
        // @ts-expect-error RPC types mismatch
        metadata = await fetchMetadataFromSeeds(rpc, {
            authority: null,
            program: address(programAddress),
            seed: 'idl',
        });
    } catch (error) {
        console.error('Metadata fetch failed', error);
        throw new Error('Metadata fetch failed');
    }
    try {
        // @ts-expect-error RPC types mismatch
        const content = await unpackAndFetchData({ rpc, ...metadata.data });
        const parsed = JSON.parse(content);
        return parsed;
    } catch (error) {
        throw new Error('JSON parse failed');
    }
}
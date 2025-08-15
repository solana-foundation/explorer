import { address, createSolanaRpc, mainnet } from '@solana/kit';
import { fetchMetadataFromSeeds, unpackAndFetchData } from '@solana-program/program-metadata';
import { RootNode } from 'codama';
import { address, createSolanaRpc, mainnet } from 'web3js-experimental';

export async function getProgramMetadataIdl(programAddress: string, url: string) {
    const rpc = createSolanaRpc(mainnet(url));
    let metadata;

    try {
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
        const content = await unpackAndFetchData({ rpc, ...metadata.data });
        const parsed = JSON.parse(content);
        return parsed;
    } catch (error) {
        throw new Error('JSON parse failed');
    }
}

export function programNameFromIdl(idl: RootNode) {
    return idl.program.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

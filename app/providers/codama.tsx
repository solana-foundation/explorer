import { fetchMetadataFromSeeds, unpackAndFetchData } from '@solana-program/program-metadata';
import useSwrImmutable from 'swr/immutable';
import { address, createSolanaRpc, mainnet } from 'web3js-experimental';

export function useCodamaIdl(programAddress: string, url: string) {
    const { data } = useSwrImmutable(`codama-idl-${programAddress}-${url}`, async () => {
        const rpc = createSolanaRpc(mainnet(url));
        let metadata;
        try {
            // @ts-expect-error RPC types not matched up with @solana-program/kit
            metadata = await fetchMetadataFromSeeds(rpc, {
                authority: null,
                program: address(programAddress),
                seed: 'idl',
            });
        } catch (error) {
            return null;
        }

        try {
            // @ts-expect-error RPC types not matched up with @solana-program/kit
            const content = await unpackAndFetchData({ rpc, ...metadata.data });
            return JSON.parse(content);
        } catch (error) {
            console.error(error, 'Error parsing Codama IDL for program', programAddress);
            return null;
        }
    });
    return { codamaIdl: data };
}

import { fetchMetadata, findMetadataPda } from '@metaplex-foundation/mpl-token-metadata';
import { fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import { PublicKey } from '@solana/web3.js';

import getEditionInfo from './get-edition-info';
import { getMetadataJson, type GetMetadataJsonDeps } from './get-metadata-json';
import type { NFTData } from './types';
import { getUmi } from './umi';

export type FetchNftDataDeps = GetMetadataJsonDeps;

export async function fetchNftData(
    accountKey: PublicKey,
    rpcEndpoint: string,
    deps?: FetchNftDataDeps,
): Promise<NFTData | undefined> {
    try {
        const umi = getUmi(rpcEndpoint);
        const mintUmiKey = fromWeb3JsPublicKey(accountKey);
        const metadataPda = findMetadataPda(umi, { mint: mintUmiKey });
        const metadata = await fetchMetadata(umi, metadataPda);
        if (metadata) {
            const editionInfo = await getEditionInfo(metadata, rpcEndpoint);
            const json = await getMetadataJson(metadata, deps);
            return { editionInfo, json, metadata };
        }
    } catch {
        // unable to find NFT metadata account
    }
    return undefined;
}

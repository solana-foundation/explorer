// Synchronous stub for useCollectionNfts; bypasses suspense-mode SWR + getProgramAccounts.

import type { NftokenMetadata, NftokenNftInfo } from '@explorer/decoder-nftoken';

import fixture from './nftoken-collection.json';

const noop = () => undefined;

const SAMPLE_NFTS: NftokenNftInfo[] = fixture.nfts.map((nft, i) => ({
    address: nft.address,
    authority: nft.authority,
    authority_can_update: nft.authority_can_update,
    collection: nft.collection,
    delegate: nft.delegate,
    holder: nft.holder,
    // Mock skips real metadata fetch — length-prefix in captured bytes wasn't stripped.
    metadata_url: '',
    // Synthetic display fields — the real metadata fetch is bypassed in Storybook.
    image: '',
    name: `Sample NFT #${i + 1}`,
}));

export function useCollectionNfts(_args: { collectionAddress: string }): {
    data: NftokenNftInfo[];
    error: null;
    mutate: () => void;
} {
    return { data: SAMPLE_NFTS, error: null, mutate: noop };
}

export function useNftokenMetadata(_args: { url: string | null | undefined }): {
    data: NftokenMetadata | null;
    error: null;
    mutate: () => void;
} {
    return { data: null, error: null, mutate: noop };
}

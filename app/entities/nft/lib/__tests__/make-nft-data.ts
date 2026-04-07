import type { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { none, publicKey, some } from '@metaplex-foundation/umi';
import { PublicKey } from '@solana/web3.js';

import type { EditionInfo, NFTData, NftJson } from '../types';

export function makeMetadata(overrides: Partial<Metadata> = {}): Metadata {
    return {
        collection: none(),
        collectionDetails: none(),
        creators: none(),
        editionNonce: some(255),
        header: {} as any,
        isMutable: true,
        key: 4,
        mint: PublicKey.default.toString() as any,
        name: 'Test NFT',
        primarySaleHappened: false,
        programmableConfig: none(),
        publicKey: PublicKey.default.toString() as any,
        sellerFeeBasisPoints: 500,
        symbol: 'TEST',
        tokenStandard: none(),
        updateAuthority: PublicKey.default.toString() as any,
        uri: 'https://example.com/metadata.json',
        uses: none(),
        ...overrides,
    } as Metadata;
}

export function makeNftData(
    overrides: {
        name?: string;
        symbol?: string;
        editionInfo?: EditionInfo;
        collection?: { key: string; verified: boolean } | null;
        creators?: Array<{ address: string; verified: boolean; share: number }> | null;
        json?: NftJson;
    } = {},
): NFTData {
    const {
        name = 'Test NFT',
        symbol = 'TNFT',
        editionInfo = { edition: undefined, masterEdition: undefined },
        collection = null,
        creators = null,
        json,
    } = overrides;
    return {
        editionInfo,
        json: json ?? { image: 'https://example.com/image.png', name },
        metadata: makeMetadata({
            collection: collection ? some({ ...collection, key: publicKey(collection.key) }) : none(),
            creators: creators
                ? some(creators.map(c => ({ ...c, address: publicKey(c.address) })))
                : none(),
            name,
            symbol,
            tokenStandard: some(0),
        }),
    };
}

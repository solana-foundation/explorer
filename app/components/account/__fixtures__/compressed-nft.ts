import type { CompressedNft } from '@providers/compressed-nft';

export function compressedNft({
    assetInterface = 'V1_NFT',
    collection = null,
    compressed = true,
    mutable = true,
    name = 'Compressed Ape #42',
    owner = '',
    symbol = 'cAPE',
}: Partial<{
    assetInterface: string;
    collection: string | null;
    compressed: boolean;
    mutable: boolean;
    name: string;
    owner: string;
    symbol: string;
}> = {}): CompressedNft {
    return {
        authorities: [],
        burnt: false,
        compression: {
            asset_hash: '',
            compressed,
            creator_hash: '',
            data_hash: '',
            eligible: compressed,
            leaf_id: 0,
            seq: 0,
            tree: '',
        },
        content: {
            $schema: '',
            files: [],
            // Empty json_uri → useMetadataJsonLink short-circuits to null; ArtContent renders the placeholder.
            json_uri: '',
            links: { external_url: '', image: '' },
            metadata: { attributes: [], description: '', name, symbol, token_standard: '' },
        },
        creators: [],
        grouping: collection ? [{ group_key: 'collection', group_value: collection }] : [],
        id: 'CompressedNftaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        interface: assetInterface,
        mutable,
        ownership: { delegate: null, delegated: false, frozen: false, owner, ownership_model: 'single' },
        royalty: {
            basis_points: 0,
            locked: false,
            percent: 0,
            primary_sale_happened: false,
            royalty_model: '',
            target: null,
        },
        supply: { edition_nonce: null, print_current_supply: 0, print_max_supply: 0 },
    };
}

export const FUNGIBLE_TOKEN = {
    assetInterface: 'FungibleToken',
    compressed: false,
    mutable: false,
    name: 'dogwifhat',
    symbol: '$WIF',
};

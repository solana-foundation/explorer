import type { Edition, MasterEdition, Metadata } from '@metaplex-foundation/mpl-token-metadata';

export type EditionInfo = {
    masterEdition?: MasterEdition;
    edition?: Edition;
};

export type NFTData = {
    metadata: Metadata;
    json: NftJson | undefined;
    editionInfo: EditionInfo;
};

export interface NftJson {
    name?: string;
    symbol?: string;
    description?: string;
    image?: string;
    animation_url?: string;
    external_url?: string;
    attributes?: Array<{ trait_type: string; value: string | number }>;
    properties?: {
        files?: Array<NftJsonFile | string>;
        category?: string;
        creators?: Array<{ address: string; share: number }>;
    };
}

export interface NftJsonFile {
    uri?: string;
    type?: string;
    cdn?: boolean;
}

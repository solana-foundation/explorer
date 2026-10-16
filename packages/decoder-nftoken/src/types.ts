export type NftokenMetadata = {
    name: string;
    description: string | null;

    image: string;
    traits: unknown;

    animation_url: string | null;
    external_url: string | null;
};

export type NftokenCollectionAccount = {
    address: string;
    authority: string;
    authority_can_update: boolean;

    metadata_url: string | null;
};

export type NftokenNftAccount = {
    address: string;
    holder: string;
    authority: string;
    authority_can_update: boolean;

    collection: string | null;
    delegate: string | null;

    metadata_url: string;
};

export type NftokenNftInfo = NftokenNftAccount & Partial<NftokenMetadata>;

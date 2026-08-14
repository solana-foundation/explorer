import {
    addDecoderSizePrefix,
    fixDecoderSize,
    getAddressDecoder,
    getBytesDecoder,
    getStructDecoder,
    getU8Decoder,
    getU32Decoder,
    getUtf8Decoder,
} from '@solana/kit';

/** Borsh `String`: a u32 little-endian byte length followed by that many UTF-8 bytes. */
const metadataUrlDecoder = () => addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder());

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace NftokenTypes {
    export type Metadata = {
        name: string;
        description: string | null;

        image: string;
        traits: any;

        animation_url: string | null;
        external_url: string | null;
    };

    export type CollectionAccount = {
        address: string;
        authority: string;
        authority_can_update: boolean;

        metadata_url: string | null;
    };

    export type NftAccount = {
        address: string;
        holder: string;
        authority: string;
        authority_can_update: boolean;

        collection: string | null;
        delegate: string | null;

        metadata_url: string;
    };

    export type NftInfo = NftAccount & Partial<Metadata>;

    export const nftAccountDecoder = getStructDecoder([
        ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
        ['version', getU8Decoder()],
        ['holder', getAddressDecoder()],
        ['authority', getAddressDecoder()],
        ['authority_can_update', getU8Decoder()],
        ['collection', getAddressDecoder()],
        ['delegate', getAddressDecoder()],
        ['is_frozen', getU8Decoder()],
        ['unused_1', getU8Decoder()],
        ['unused_2', getU8Decoder()],
        ['unused_3', getU8Decoder()],
        ['unused_4', getU8Decoder()],
        ['metadata_url', metadataUrlDecoder()],
    ]);

    export const collectionAccountDecoder = getStructDecoder([
        ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
        ['version', getU8Decoder()],
        ['authority', getAddressDecoder()],
        ['authority_can_update', getU8Decoder()],
        ['unused_1', getU8Decoder()],
        ['unused_2', getU8Decoder()],
        ['unused_3', getU8Decoder()],
        ['unused_4', getU8Decoder()],
        ['metadata_url', metadataUrlDecoder()],
    ]);
}

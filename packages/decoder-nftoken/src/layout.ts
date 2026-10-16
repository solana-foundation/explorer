import {
    addDecoderSizePrefix,
    fixDecoderSize,
    getAddressDecoder,
    getBytesDecoder,
    getStructDecoder,
    getU8Decoder,
    getU32Decoder,
    getUtf8Decoder,
    type ReadonlyUint8Array,
} from '@solana/kit';

/** Borsh `String`: a u32 little-endian byte length followed by that many UTF-8 bytes. */
const metadataUrlDecoder = () => addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder());

const NFT_ACCOUNT_DISCRIMINATOR = Uint8Array.of(33, 180, 91, 53, 236, 15, 63, 97);
const COLLECTION_ACCOUNT_DISCRIMINATOR = Uint8Array.of(69, 2, 240, 3, 118, 18, 217, 242);

/**
 * The NFT account discriminator as base58, for an RPC `memcmp` filter at offset 0.
 */
export const NFT_ACCOUNT_DISCRIMINATOR_BASE58 = '6dycNg3Aybe';

/**
 * Byte offset of an NFT account's `collection` field, for an RPC `memcmp` filter.
 *
 * 8 discriminator + 1 version + 32 holder + 32 authority + 1 authority_can_update.
 */
export const NFT_ACCOUNT_COLLECTION_OFFSET = 74n;

export const hasNftAccountDiscriminator = (data: ReadonlyUint8Array): boolean =>
    hasDiscriminator(data, NFT_ACCOUNT_DISCRIMINATOR);

export const hasCollectionAccountDiscriminator = (data: ReadonlyUint8Array): boolean =>
    hasDiscriminator(data, COLLECTION_ACCOUNT_DISCRIMINATOR);

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

/**
 * Whether account data opens with the given 8-byte account discriminator.
 *
 * Checked before decoding: the NFT and collection accounts share an owner and a
 * discriminator prefix but not a size, so decoding an account against the wrong
 * layout runs off the end of the buffer and throws.
 */
function hasDiscriminator(data: ReadonlyUint8Array, discriminator: Uint8Array): boolean {
    return data.length >= discriminator.length && discriminator.every((byte, i) => data[i] === byte);
}

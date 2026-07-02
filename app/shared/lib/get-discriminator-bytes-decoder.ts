import { type Decoder, fixDecoderSize, getBytesDecoder, type ReadonlyUint8Array } from '@solana/kit';

/**
 * Fixed-size byte decoder for an instruction discriminator.
 *
 * Works around a Codama codegen quirk in `@solana-program/*` packages whose SPL
 * "interface" instructions (Token Metadata / Token Group) declare their 8-byte
 * discriminator as an *unbounded* `getBytesDecoder()`. As the first field of a
 * struct decoder that greedily consumes the entire instruction buffer, leaving
 * every downstream field to decode from an empty slice — and throw. Bounding the
 * discriminator to `size` bytes restores correct sequential decoding.
 *
 * Still required as of `@solana-program/token-2022@0.12.0`.
 */
export function getDiscriminatorBytesDecoder(size = 8): Decoder<ReadonlyUint8Array> {
    return fixDecoderSize(getBytesDecoder(), size);
}

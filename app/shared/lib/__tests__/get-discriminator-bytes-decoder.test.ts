import { addDecoderSizePrefix, getStructDecoder, getU32Decoder, getUtf8Decoder } from '@solana/kit';
import { describe, expect, test } from 'vitest';

import { getDiscriminatorBytesDecoder } from '../get-discriminator-bytes-decoder';

describe('getDiscriminatorBytesDecoder', () => {
    test('should read exactly 8 bytes by default, leaving the remainder', () => {
        const bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        const [value, offset] = getDiscriminatorBytesDecoder().read(bytes, 0);
        expect(Array.from(value)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
        expect(offset).toBe(8);
    });

    test('should honour a custom size', () => {
        const [value, offset] = getDiscriminatorBytesDecoder(4).read(new Uint8Array([1, 2, 3, 4, 5]), 0);
        expect(Array.from(value)).toEqual([1, 2, 3, 4]);
        expect(offset).toBe(4);
    });

    test('should leave trailing struct fields decodable — the bug it works around', () => {
        // An unbounded getBytesDecoder() as the first struct field would swallow
        // the whole buffer, leaving the string to decode from an empty slice and
        // throw. Bounding the discriminator keeps the remaining fields intact.
        const decoder = getStructDecoder([
            ['discriminator', getDiscriminatorBytesDecoder()],
            ['value', addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
        ]);
        const discriminator = new Uint8Array(8).fill(0xff);
        const value = new Uint8Array([2, 0, 0, 0, 0x68, 0x69]); // u32 length 2 + "hi"
        const decoded = decoder.decode(new Uint8Array([...discriminator, ...value]));
        expect(decoded.value).toBe('hi');
        expect(Array.from(decoded.discriminator)).toEqual(Array.from(discriminator));
    });
});

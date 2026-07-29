import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { hashProgramData } from '../hash-program-data.js';

describe('hashProgramData', () => {
    it('should produce the expected sha256 for a known input', () => {
        const data = Buffer.from('deadbeef', 'hex');

        expect(hashProgramData(data.toString('base64'))).toBe(
            '5f78c33274e43fa9de5659265c1d917e25c03722dcb0b8d27db8d5feaa813953',
        );
    });

    it('should strip trailing null bytes before hashing', () => {
        const core = Buffer.from('deadbeef', 'hex');
        const withNulls = Buffer.concat([core, Buffer.alloc(16)]);

        expect(hashProgramData(withNulls.toString('base64'))).toBe(hashProgramData(core.toString('base64')));
    });

    it('should handle an all-zero buffer without an out-of-bounds read', () => {
        const allZero = Buffer.alloc(32);

        // sha256 of the empty buffer (all bytes truncated)
        expect(hashProgramData(allZero.toString('base64'))).toBe(
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        );
    });

    it('should handle empty input', () => {
        expect(hashProgramData(Buffer.alloc(0).toString('base64'))).toBe(
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        );
    });

    // Backend-parity pin: @noble/hashes replaced node:crypto — digests must stay byte-identical.
    it('should match node:crypto digests on a varied buffer with trailing zeros', () => {
        const data = Buffer.from(Array.from({ length: 4096 }, (_, i) => i % 251).concat([0, 0, 0]));
        const trimmed = data.subarray(0, data.length - 3);

        expect(hashProgramData(data.toString('base64'))).toBe(createHash('sha256').update(trimmed).digest('hex'));
    });
});

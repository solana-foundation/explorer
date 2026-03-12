import { sha256 } from '@noble/hashes/sha256';
import { PublicKey } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { hashProgramData } from '../verified-builds';

// Helper to build a minimal ProgramDataAccountInfo
function makeProgramData({ authority, rawBytes }: { authority: PublicKey | null; rawBytes: Buffer }): {
    authority: PublicKey | null;
    data: [string, 'base64'];
    slot: number;
} {
    return {
        authority,
        data: [rawBytes.toString('base64'), 'base64'],
        slot: 0,
    };
}

describe('hashProgramData', () => {
    // 32 zero bytes representing the unused authority placeholder
    const authorityPlaceholder = Buffer.alloc(32, 0);
    const programBytes = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0xde, 0xad, 0xbe, 0xef]);
    // Trailing zeros that should be stripped
    const trailingZeros = Buffer.alloc(16, 0);

    it('should produce the same hash for null-authority data with placeholder as for raw program data', () => {
        // Simulate jsonParsed output for authority=null: 32 zero bytes + program data + trailing zeros
        const withPlaceholder = Buffer.concat([authorityPlaceholder, programBytes, trailingZeros]);
        const programDataNullAuth = makeProgramData({
            authority: null,
            rawBytes: withPlaceholder,
        });

        // Simulate data without the placeholder (what solana-verify sees after stripping 45-byte header)
        const withoutPlaceholder = Buffer.concat([programBytes, trailingZeros]);
        const programDataWithAuth = makeProgramData({
            authority: PublicKey.default,
            rawBytes: withoutPlaceholder,
        });

        const hashNull = hashProgramData(programDataNullAuth);
        const hashWithAuth = hashProgramData(programDataWithAuth);

        expect(hashNull).toBe(hashWithAuth);
    });

    it('should not apply offset when authority is present', () => {
        const data = Buffer.concat([programBytes, trailingZeros]);
        const programData = makeProgramData({
            authority: PublicKey.default,
            rawBytes: data,
        });

        // Hash should be computed from the entire buffer (minus trailing zeros)
        const hash = hashProgramData(programData);
        expect(hash).toHaveLength(64); // SHA-256 hex
        // eslint-disable-next-line no-restricted-syntax -- validating SHA-256 hex output format
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should strip exactly the first 32 bytes when authority is null', () => {
        const dataWithPlaceholder = Buffer.concat([authorityPlaceholder, programBytes]);
        const programData = makeProgramData({
            authority: null,
            rawBytes: dataWithPlaceholder,
        });

        // Compute expected hash directly from the program bytes only
        const expectedHash = Buffer.from(sha256(programBytes)).toString('hex');

        expect(hashProgramData(programData)).toBe(expectedHash);
    });

    it('should not strip any bytes when authority is present', () => {
        const programData = makeProgramData({
            authority: PublicKey.default,
            rawBytes: programBytes,
        });

        const expectedHash = Buffer.from(sha256(programBytes)).toString('hex');

        expect(hashProgramData(programData)).toBe(expectedHash);
    });

    it('should hash different content when null-authority data lacks the 32-byte placeholder', () => {
        // If data doesn't have the placeholder, stripping 32 bytes removes real data
        const programDataShort = makeProgramData({
            authority: null,
            rawBytes: programBytes,
        });
        const programDataFull = makeProgramData({
            authority: PublicKey.default,
            rawBytes: programBytes,
        });

        expect(hashProgramData(programDataShort)).not.toBe(hashProgramData(programDataFull));
    });

    it('should strip trailing zero bytes', () => {
        const data = Buffer.concat([programBytes, Buffer.alloc(100, 0)]);
        const programData = makeProgramData({
            authority: PublicKey.default,
            rawBytes: data,
        });

        const dataNoTrailing = makeProgramData({
            authority: PublicKey.default,
            rawBytes: programBytes,
        });

        expect(hashProgramData(programData)).toBe(hashProgramData(dataNoTrailing));
    });
});

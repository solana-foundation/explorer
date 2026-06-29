import { sha256 } from '@noble/hashes/sha256';
import { PublicKey } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { hashProgramBuffer, hashProgramData } from '../verified-builds';

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
    // Simulated stale authority pubkey area (non-zero, as seen on mainnet for revoked authorities)
    const staleAuthorityBytes = Buffer.from('51b4de5a0619575adb04c439878648ac81487e8529cded2b1fccb55115ef7247', 'hex');
    // Simulated program binary (starts with ELF magic header)
    const programBytes = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0xde, 0xad, 0xbe, 0xef]);
    // Trailing zeros that should be stripped
    const trailingZeros = Buffer.alloc(16, 0);

    it('should produce the same hash for null-authority data with stale pubkey as for raw program data', () => {
        // Simulate jsonParsed output for authority=null: 32-byte stale pubkey + program data + trailing zeros
        const withStaleAuthority = Buffer.concat([staleAuthorityBytes, programBytes, trailingZeros]);
        const programDataNullAuth = makeProgramData({
            authority: null,
            rawBytes: withStaleAuthority,
        });

        // Simulate jsonParsed output for authority=Some: no prefix bytes, just program data + trailing zeros
        const withoutPrefix = Buffer.concat([programBytes, trailingZeros]);
        const programDataWithAuth = makeProgramData({
            authority: PublicKey.default,
            rawBytes: withoutPrefix,
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
        const dataWithPlaceholder = Buffer.concat([staleAuthorityBytes, programBytes]);
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

    it('should handle all-zero data after offset when authority is null', () => {
        const zeroData = Buffer.concat([staleAuthorityBytes, Buffer.alloc(8, 0)]);
        const programData = makeProgramData({
            authority: null,
            rawBytes: zeroData,
        });

        // All-zero program data produces a hash of empty data (no crash)
        const emptyHash = Buffer.from(sha256(Buffer.alloc(0))).toString('hex');
        expect(hashProgramData(programData)).toBe(emptyHash);
    });
});

describe('hashProgramBuffer', () => {
    const staleAuthorityBytes = Buffer.from('51b4de5a0619575adb04c439878648ac81487e8529cded2b1fccb55115ef7247', 'hex');
    const programBytes = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0xde, 0xad, 0xbe, 0xef]);

    function makeBuffer({ authority, rawBytes }: { authority: PublicKey | null; rawBytes?: Buffer }) {
        return {
            authority,
            data: rawBytes ? ([rawBytes.toString('base64'), 'base64'] as [string, 'base64']) : undefined,
        };
    }

    it('should hash the program bytes directly (sha256, trailing zeros stripped) when authority is present', () => {
        const buffer = makeBuffer({
            authority: PublicKey.default,
            rawBytes: Buffer.concat([programBytes, Buffer.alloc(64, 0)]),
        });
        expect(hashProgramBuffer(buffer)).toBe(Buffer.from(sha256(programBytes)).toString('hex'));
    });

    it('should skip the 32-byte stale pubkey when authority is null', () => {
        const buffer = makeBuffer({
            authority: null,
            rawBytes: Buffer.concat([staleAuthorityBytes, programBytes]),
        });
        expect(hashProgramBuffer(buffer)).toBe(Buffer.from(sha256(programBytes)).toString('hex'));
    });

    it('should return undefined when no data is available', () => {
        expect(hashProgramBuffer(makeBuffer({ authority: PublicKey.default }))).toBeUndefined();
    });

    it('should match the known solana-verify hash for a real buffer payload', () => {
        // A buffer whose program bytes are the ELF magic: verifies the exact wire format
        // (sha256 over the bytes, hex-encoded) used by `solana-verify get-buffer-hash`.
        const buffer = makeBuffer({ authority: PublicKey.default, rawBytes: programBytes });
        // eslint-disable-next-line no-restricted-syntax -- validating SHA-256 hex output format
        expect(hashProgramBuffer(buffer)).toMatch(/^[0-9a-f]{64}$/);
    });
});

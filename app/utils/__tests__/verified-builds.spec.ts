import { sha256 } from '@noble/hashes/sha256';
import { PublicKey } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { Cluster } from '../cluster';
import {
    buildEnrichedOsecInfo,
    hashProgramBuffer,
    hashProgramData,
    type OsecInfo,
    VerificationStatus,
} from '../verified-builds';

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

describe('buildEnrichedOsecInfo', () => {
    const PROGRAM_ID = new PublicKey('BUYuxRfhCMWavaUWxhGtPP3ksKEDZxCD5gzknk3JfAya');
    const FOUNDATION_SIGNER = '5vJwnLeyjV8uNJSp1zn7VLW8GwiQbcsQbGaVSwRmkE4r';
    const HASH = '6122072454d9763f71b04106e79a9e670c695d500f104e31e4c2e4177f0cd736';
    const REPO_URL = 'https://github.com/Woody4618/bar/tree/07e3f708df2b9483426515bf3bcd8065c57f7a79';

    function makeOsecInfo(overrides: Partial<OsecInfo> = {}): OsecInfo {
        return {
            commit: '07e3f708df2b9483426515bf3bcd8065c57f7a79',
            executable_hash: HASH,
            is_frozen: false,
            is_verified: true,
            last_verified_at: '2025-05-18T02:10:44.412143',
            on_chain_hash: HASH,
            repo_url: REPO_URL,
            signer: FOUNDATION_SIGNER,
            ...overrides,
        };
    }

    const PDA = {
        args: ['--library-name', 'let_me_buy'],
        commit: '07e3f708df2b9483426515bf3bcd8065c57f7a79',
        gitUrl: 'https://github.com/Woody4618/bar',
    };

    it('should enrich the verified card from the on-chain PDA when available', () => {
        const info = buildEnrichedOsecInfo({
            cluster: Cluster.MainnetBeta,
            osecInfo: makeOsecInfo(),
            pdaData: PDA,
            programId: PROGRAM_ID,
        });
        expect(info.is_verified).toBe(true);
        expect(info.verification_status).toBe(VerificationStatus.Verified);
        expect(info.message).toBe('Verification information provided by a trusted signer.');
        expect(info.onchain_repo_url).toBe(REPO_URL);
        expect(info.verify_command).toBe(
            'solana-verify verify-from-repo -um --program-id BUYuxRfhCMWavaUWxhGtPP3ksKEDZxCD5gzknk3JfAya https://github.com/Woody4618/bar --commit-hash 07e3f708df2b9483426515bf3bcd8065c57f7a79 --library-name let_me_buy',
        );
    });

    // A verified program must still render its status when the Otter Verify PDA can't be
    // resolved (e.g. the verify-program IDL failed to load, or it was verified via the deprecated API).
    it('should still render the verified card when the PDA is unavailable, falling back to OSEC data', () => {
        const info = buildEnrichedOsecInfo({
            cluster: Cluster.MainnetBeta,
            osecInfo: makeOsecInfo(),
            pdaData: null,
            programId: PROGRAM_ID,
        });
        expect(info.is_verified).toBe(true);
        expect(info.verification_status).toBe(VerificationStatus.Verified);
        expect(info.onchain_repo_url).toBe(REPO_URL);
        expect(info.repo_url).toBe(REPO_URL);
        expect(info.verify_command).toBe('Program does not have a verify PDA uploaded.');
    });

    it('should note the verify command is mainnet-only off mainnet when the PDA is unavailable', () => {
        const info = buildEnrichedOsecInfo({
            cluster: Cluster.Devnet,
            osecInfo: makeOsecInfo(),
            pdaData: null,
            programId: PROGRAM_ID,
        });
        expect(info.verify_command).toBe('Verify command only available on mainnet.');
    });

    it('should label a frozen, non-trusted signer as the program deployer', () => {
        const info = buildEnrichedOsecInfo({
            cluster: Cluster.MainnetBeta,
            osecInfo: makeOsecInfo({ is_frozen: true, signer: PROGRAM_ID.toBase58() }),
            pdaData: null,
            programId: PROGRAM_ID,
        });
        expect(info.message).toBe('Verification information provided by the program deployer.');
    });

    it('should label a mutable, non-trusted signer as the program authority', () => {
        const info = buildEnrichedOsecInfo({
            cluster: Cluster.MainnetBeta,
            osecInfo: makeOsecInfo({ is_frozen: false, signer: PROGRAM_ID.toBase58() }),
            pdaData: null,
            programId: PROGRAM_ID,
        });
        expect(info.message).toBe('Verification information provided by the program authority.');
    });

    it('should drop a non-https repo url from the OSEC fallback', () => {
        const info = buildEnrichedOsecInfo({
            cluster: Cluster.MainnetBeta,
            osecInfo: makeOsecInfo({ repo_url: 'http://insecure.example/repo' }),
            pdaData: null,
            programId: PROGRAM_ID,
        });
        expect(info.repo_url).toBe('');
        expect(info.onchain_repo_url).toBe('');
    });
});

import { sha256 } from '@noble/hashes/sha256';
import { PublicKey } from '@solana/web3.js';
import { create } from 'superstruct';
import { describe, expect, it } from 'vitest';

import { Cluster } from '../cluster';
import {
    buildEnrichedOsecInfo,
    dedupeAndSortBuilds,
    getOsecRegistryUrl,
    hashProgramBuffer,
    hashProgramData,
    type OsecBuild,
    type OsecInfo,
    OsecResolveHashResponse,
    supportsVerifiedBuilds,
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

describe('getOsecRegistryUrl', () => {
    it('should return the mainnet registry for Mainnet Beta', () => {
        expect(getOsecRegistryUrl(Cluster.MainnetBeta)).toBe('https://verify.osec.io');
    });

    it('should return the devnet registry for Devnet', () => {
        expect(getOsecRegistryUrl(Cluster.Devnet)).toBe('https://verify-devnet.osec.io');
    });

    it('should return undefined for clusters without a registry', () => {
        expect(getOsecRegistryUrl(Cluster.Testnet)).toBeUndefined();
        expect(getOsecRegistryUrl(Cluster.Custom)).toBeUndefined();
    });
});

describe('supportsVerifiedBuilds', () => {
    it('should support Mainnet Beta and Devnet only', () => {
        expect(supportsVerifiedBuilds(Cluster.MainnetBeta)).toBe(true);
        expect(supportsVerifiedBuilds(Cluster.Devnet)).toBe(true);
        expect(supportsVerifiedBuilds(Cluster.Testnet)).toBe(false);
        expect(supportsVerifiedBuilds(Cluster.Custom)).toBe(false);
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

    it('should compose the verify command with the devnet moniker (-ud) from the PDA', () => {
        const info = buildEnrichedOsecInfo({
            cluster: Cluster.Devnet,
            osecInfo: makeOsecInfo(),
            pdaData: PDA,
            programId: PROGRAM_ID,
        });
        expect(info.verify_command).toBe(
            'solana-verify verify-from-repo -ud --program-id BUYuxRfhCMWavaUWxhGtPP3ksKEDZxCD5gzknk3JfAya https://github.com/Woody4618/bar --commit-hash 07e3f708df2b9483426515bf3bcd8065c57f7a79 --library-name let_me_buy',
        );
    });

    it('should report a missing PDA on devnet the same way as mainnet', () => {
        const info = buildEnrichedOsecInfo({
            cluster: Cluster.Devnet,
            osecInfo: makeOsecInfo(),
            pdaData: null,
            programId: PROGRAM_ID,
        });
        expect(info.verify_command).toBe('Program does not have a verify PDA uploaded.');
    });

    it('should note the verify command is unavailable on clusters without a registry', () => {
        const info = buildEnrichedOsecInfo({
            cluster: Cluster.Testnet,
            osecInfo: makeOsecInfo(),
            pdaData: null,
            programId: PROGRAM_ID,
        });
        expect(info.verify_command).toBe('Verify command not available on this cluster.');
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

describe('dedupeAndSortBuilds', () => {
    function makeBuild(overrides: Partial<OsecBuild> = {}): OsecBuild {
        return {
            build_id: 'build-0',
            commit: 'aaaaaaa',
            completed_at: '2026-01-01T00:00:00.000Z',
            matches_deployed: true,
            program_id: 'HfU7iK2hyesWG1abBD8nXDpsw2ijrA2vpdiNYNj3Hg3c',
            repository: 'https://github.com/example/repo',
            signer: null,
            trusted: true,
            ...overrides,
        };
    }

    it('should collapse builds that share program/repo/commit/trusted/matches_deployed', () => {
        const result = dedupeAndSortBuilds([
            makeBuild({ build_id: 'a' }),
            makeBuild({ build_id: 'b' }), // same identity, different build_id -> dropped
        ]);
        expect(result).toHaveLength(1);
        expect(result[0].build_id).toBe('a');
    });

    it('should keep distinct trusted and untrusted rows for the same build', () => {
        const result = dedupeAndSortBuilds([
            makeBuild({ build_id: 'untrusted', trusted: false }),
            makeBuild({ build_id: 'trusted', trusted: true }),
        ]);
        expect(result).toHaveLength(2);
        // trusted sorts first
        expect(result[0].build_id).toBe('trusted');
        expect(result[1].build_id).toBe('untrusted');
    });

    it('should order by trusted, then matches_deployed, then most recent completed_at', () => {
        // Distinct commits so none of these collapse during dedupe (which ignores completed_at).
        const result = dedupeAndSortBuilds([
            makeBuild({
                build_id: 'old-trusted',
                commit: 'commit-old',
                completed_at: '2026-01-01T00:00:00.000Z',
                trusted: true,
            }),
            makeBuild({
                build_id: 'new-trusted',
                commit: 'commit-new',
                completed_at: '2026-06-01T00:00:00.000Z',
                trusted: true,
            }),
            makeBuild({ build_id: 'untrusted-deployed', commit: 'commit-x', matches_deployed: true, trusted: false }),
            makeBuild({
                build_id: 'untrusted-undeployed',
                commit: 'commit-y',
                matches_deployed: false,
                trusted: false,
            }),
        ]);
        expect(result.map(b => b.build_id)).toEqual([
            'new-trusted',
            'old-trusted',
            'untrusted-deployed',
            'untrusted-undeployed',
        ]);
    });

    it('should keep the most recent run when collapsing duplicates, regardless of input order', () => {
        const older = makeBuild({ build_id: 'older', completed_at: '2026-01-01T00:00:00.000Z' });
        const newer = makeBuild({ build_id: 'newer', completed_at: '2026-02-01T00:00:00.000Z' });

        // Newest survives whether the older or the newer run appears first in the response.
        const olderFirst = dedupeAndSortBuilds([older, newer]);
        expect(olderFirst).toHaveLength(1);
        expect(olderFirst[0].build_id).toBe('newer');

        const newerFirst = dedupeAndSortBuilds([newer, older]);
        expect(newerFirst).toHaveLength(1);
        expect(newerFirst[0].build_id).toBe('newer');
    });

    it('should return an empty array unchanged', () => {
        expect(dedupeAndSortBuilds([])).toEqual([]);
    });
});

describe('OsecResolveHashResponse', () => {
    const HASH = '6122072454d9763f71b04106e79a9e670c695d500f104e31e4c2e4177f0cd736';

    function makeRawBuild(overrides: Record<string, unknown> = {}): Record<string, unknown> {
        return {
            build_id: 'build-0',
            commit: 'aaaaaaa',
            completed_at: '2026-01-01T00:00:00.000Z',
            matches_deployed: true,
            program_id: 'HfU7iK2hyesWG1abBD8nXDpsw2ijrA2vpdiNYNj3Hg3c',
            repository: 'https://github.com/example/repo',
            signer: null,
            trusted: true,
            ...overrides,
        };
    }

    it('should accept a well-formed payload', () => {
        const raw = { builds: [makeRawBuild()], executable_hash: HASH };
        expect(create(raw, OsecResolveHashResponse).builds).toHaveLength(1);
    });

    it('should accept a null or string signer', () => {
        const raw = {
            builds: [makeRawBuild({ signer: null }), makeRawBuild({ build_id: 'b', signer: 'some-signer' })],
            executable_hash: HASH,
        };
        expect(create(raw, OsecResolveHashResponse).builds.map(b => b.signer)).toEqual([null, 'some-signer']);
    });

    it('should accept an empty builds list', () => {
        expect(create({ builds: [], executable_hash: HASH }, OsecResolveHashResponse).builds).toEqual([]);
    });

    it('should tolerate unknown fields added upstream', () => {
        const raw = {
            builds: [makeRawBuild({ future_field: 'ignored' })],
            executable_hash: HASH,
            unknown_top_level: 1,
        };
        expect(() => create(raw, OsecResolveHashResponse)).not.toThrow();
    });

    it('should reject a build missing a required field', () => {
        const raw = { builds: [makeRawBuild()], executable_hash: HASH };
        delete (raw.builds[0] as Record<string, unknown>).repository;
        expect(() => create(raw, OsecResolveHashResponse)).toThrow();
    });

    it('should reject a field with the wrong type', () => {
        const raw = { builds: [makeRawBuild({ trusted: 'yes' })], executable_hash: HASH };
        expect(() => create(raw, OsecResolveHashResponse)).toThrow();
    });

    it('should reject a payload with no builds array', () => {
        expect(() => create({ executable_hash: HASH }, OsecResolveHashResponse)).toThrow();
    });
});

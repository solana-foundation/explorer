import { gen } from '@__fixtures__/gen';
import { address } from '@solana/kit';
import { Cluster, type ServerCluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    fetchSecurityTxt: vi.fn(),
    resolveProgramIdls: vi.fn(),
}));

vi.mock('@entities/idl/server', () => ({ resolveProgramIdls: mocks.resolveProgramIdls }));
vi.mock('@solana/security-txt', () => ({ fetchSecurityTxt: mocks.fetchSecurityTxt }));
vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { getProgramProvenance, isVerifiedBuild } from '../get-program-provenance';

const PROGRAM_ID = address(gen.address(1));
// A throwaway rpc: every consumer of it is mocked, so its shape never matters.
const RPC = {} as Parameters<typeof getProgramProvenance>[0];
const AUTHORITY = gen.address(2);
const STRANGER = gen.address(9);
const HASH = 'current-on-chain-hash';

function noIdls() {
    return { anchorIdl: undefined, programMetadataIdl: undefined };
}

function run(cluster: ServerCluster = Cluster.MainnetBeta) {
    return getProgramProvenance(RPC, PROGRAM_ID, cluster, AbortSignal.timeout(1_000));
}

beforeEach(() => {
    mocks.resolveProgramIdls.mockResolvedValue(noIdls());
    mocks.fetchSecurityTxt.mockResolvedValue(undefined);
    vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve({ json: () => Promise.resolve([]), ok: true })),
    );
});

afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
});

describe('IDL marker and name', () => {
    it('should mark idlUploaded and title-case the anchor IDL name', async () => {
        mocks.resolveProgramIdls.mockResolvedValue({ anchorIdl: { metadata: { name: 'jupiter_aggregator' } } });

        const result = await run();

        expect(result.idlUploaded).toBe(true);
        expect(result.name).toBe('Jupiter Aggregator');
    });

    it('should fall back to the program-metadata IDL program name', async () => {
        mocks.resolveProgramIdls.mockResolvedValue({
            programMetadataIdl: { program: { name: 'my-program' }, standard: 'codama' },
        });

        const result = await run();

        expect(result.idlUploaded).toBe(true);
        expect(result.name).toBe('My Program');
    });

    it('should leave idlUploaded false and the name absent when no IDL is published', async () => {
        const result = await run();

        expect(result.idlUploaded).toBe(false);
        expect(result.name).toBeUndefined();
    });

    it('should fail soft to no IDL when the resolver throws', async () => {
        mocks.resolveProgramIdls.mockRejectedValue(new Error('rpc down'));

        const result = await run();

        expect(result.idlUploaded).toBe(false);
        expect(result.name).toBeUndefined();
    });
});

describe('verified-build registry entries', () => {
    it('should surface the registry entries for a cluster that has one', async () => {
        const entries = [{ is_verified: true, on_chain_hash: HASH, signer: AUTHORITY }];
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve({ json: () => Promise.resolve(entries), ok: true })),
        );

        const result = await run();

        expect(result.verifiedEntries).toEqual(entries);
    });

    it('should drop malformed entries so one bad element cannot hide a valid one', async () => {
        const good = { is_verified: true, on_chain_hash: HASH, signer: AUTHORITY };
        vi.stubGlobal(
            'fetch',
            vi.fn(() =>
                Promise.resolve({ json: () => Promise.resolve([null, 'nope', { signer: 1 }, good]), ok: true }),
            ),
        );

        const result = await run();

        expect(result.verifiedEntries).toEqual([good]);
    });

    it('should skip the registry entirely on a cluster that has none', async () => {
        const result = await run(Cluster.Testnet);

        expect(result.verifiedEntries).toEqual([]);
        expect(fetch).not.toHaveBeenCalled();
    });

    it('should fail soft to no entries when the registry request throws', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.reject(new Error('network'))),
        );

        const result = await run();

        expect(result.verifiedEntries).toEqual([]);
    });

    it('should fail soft to no entries on a non-ok response', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve({ json: () => Promise.resolve([]), ok: false })),
        );

        const result = await run();

        expect(result.verifiedEntries).toEqual([]);
    });
});

describe('isVerifiedBuild', () => {
    it('should verify an authority-signed entry whose hash matches the current bytes', () => {
        const entries = [{ is_verified: true, on_chain_hash: HASH, signer: AUTHORITY }];

        expect(isVerifiedBuild(entries, AUTHORITY, HASH)).toBe(true);
    });

    it('should reject an entry signed by neither the authority nor a trusted signer', () => {
        const entries = [{ is_verified: true, on_chain_hash: HASH, signer: STRANGER }];

        expect(isVerifiedBuild(entries, AUTHORITY, HASH)).toBe(false);
    });

    it('should reject a stale entry whose hash no longer matches the deployed bytes', () => {
        const entries = [{ is_verified: true, on_chain_hash: 'hash-from-before-the-upgrade', signer: AUTHORITY }];

        expect(isVerifiedBuild(entries, AUTHORITY, HASH)).toBe(false);
    });

    it('should return false when the local hash could not be computed', () => {
        const entries = [{ is_verified: true, on_chain_hash: HASH, signer: AUTHORITY }];

        expect(isVerifiedBuild(entries, AUTHORITY, undefined)).toBe(false);
    });

    it('should accept a frozen entry for an immutable program with no authority', () => {
        const entries = [{ is_frozen: true, is_verified: true, on_chain_hash: HASH, signer: STRANGER }];

        expect(isVerifiedBuild(entries, undefined, HASH)).toBe(true);
    });
});

describe('security.txt marker', () => {
    it('should mark securityTxt when one is resolved', async () => {
        mocks.fetchSecurityTxt.mockResolvedValue({ fields: {}, type: 'pmp' });

        const result = await run();

        expect(result.securityTxt).toBe(true);
    });

    it('should leave securityTxt false when none is found', async () => {
        const result = await run();

        expect(result.securityTxt).toBe(false);
    });

    it('should fail soft to no security.txt when the lookup throws', async () => {
        mocks.fetchSecurityTxt.mockRejectedValue(new Error('rpc down'));

        const result = await run();

        expect(result.securityTxt).toBe(false);
    });
});

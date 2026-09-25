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

import { getProgramProvenance, verifiedBuildState, type VerifiedLookup } from '../get-program-provenance';

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

type OsecEntry = Extract<VerifiedLookup, { kind: 'entries' }>['entries'][number];

function entriesLookup(entries: OsecEntry[]): VerifiedLookup {
    return { entries, kind: 'entries' };
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

        expect(result.idlUploaded).toBe('yes');
        expect(result.name).toBe('Jupiter Aggregator');
    });

    it('should fall back to the program-metadata IDL program name', async () => {
        mocks.resolveProgramIdls.mockResolvedValue({
            programMetadataIdl: { program: { name: 'my-program' }, standard: 'codama' },
        });

        const result = await run();

        expect(result.idlUploaded).toBe('yes');
        expect(result.name).toBe('My Program');
    });

    it('should leave idlUploaded no and the name absent when no IDL is published', async () => {
        const result = await run();

        expect(result.idlUploaded).toBe('no');
        expect(result.name).toBeUndefined();
    });

    it('should report idlUploaded unknown when the resolver throws (a transient RPC failure)', async () => {
        mocks.resolveProgramIdls.mockRejectedValue(new Error('rpc down'));

        const result = await run();

        expect(result.idlUploaded).toBe('unknown');
        expect(result.name).toBeUndefined();
    });
});

describe('verified-build lookup', () => {
    it('should surface the registry entries for a cluster that has one', async () => {
        const entries = [{ is_verified: true, on_chain_hash: HASH, signer: AUTHORITY }];
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve({ json: () => Promise.resolve(entries), ok: true })),
        );

        const result = await run();

        expect(result.verified).toEqual({ entries, kind: 'entries' });
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

        expect(result.verified).toEqual({ entries: [good], kind: 'entries' });
    });

    it('should report no registry on a cluster that has none, without a request', async () => {
        const result = await run(Cluster.Testnet);

        expect(result.verified).toEqual({ kind: 'none' });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('should report the lookup unavailable when the registry request throws', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.reject(new Error('network'))),
        );

        const result = await run();

        expect(result.verified).toEqual({ kind: 'unavailable' });
    });

    it('should report the lookup unavailable on a non-ok response', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve({ json: () => Promise.resolve([]), ok: false })),
        );

        const result = await run();

        expect(result.verified).toEqual({ kind: 'unavailable' });
    });
});

describe('verifiedBuildState', () => {
    it('should verify an authority-signed entry whose hash matches the current bytes', () => {
        const lookup = entriesLookup([{ is_verified: true, on_chain_hash: HASH, signer: AUTHORITY }]);

        expect(verifiedBuildState(lookup, AUTHORITY, HASH)).toBe('yes');
    });

    it('should reject an entry signed by neither the authority nor a trusted signer', () => {
        const lookup = entriesLookup([{ is_verified: true, on_chain_hash: HASH, signer: STRANGER }]);

        expect(verifiedBuildState(lookup, AUTHORITY, HASH)).toBe('no');
    });

    it('should reject a stale entry whose hash no longer matches the deployed bytes', () => {
        const lookup = entriesLookup([
            { is_verified: true, on_chain_hash: 'hash-from-before-the-upgrade', signer: AUTHORITY },
        ]);

        expect(verifiedBuildState(lookup, AUTHORITY, HASH)).toBe('no');
    });

    it('should report unknown when the local hash could not be computed', () => {
        const lookup = entriesLookup([{ is_verified: true, on_chain_hash: HASH, signer: AUTHORITY }]);

        expect(verifiedBuildState(lookup, AUTHORITY, undefined)).toBe('unknown');
    });

    it('should report unknown when the registry lookup was unavailable', () => {
        expect(verifiedBuildState({ kind: 'unavailable' }, AUTHORITY, HASH)).toBe('unknown');
    });

    it('should report unknown when the cluster has no registry to check against', () => {
        expect(verifiedBuildState({ kind: 'none' }, AUTHORITY, HASH)).toBe('unknown');
    });

    it('should report no when the registry answered with no entries', () => {
        expect(verifiedBuildState(entriesLookup([]), AUTHORITY, HASH)).toBe('no');
    });

    it('should accept a frozen entry for an immutable program with no authority', () => {
        const lookup = entriesLookup([{ is_frozen: true, is_verified: true, on_chain_hash: HASH, signer: STRANGER }]);

        expect(verifiedBuildState(lookup, undefined, HASH)).toBe('yes');
    });
});

describe('security.txt marker', () => {
    it('should mark securityTxt when one is resolved', async () => {
        mocks.fetchSecurityTxt.mockResolvedValue({ fields: {}, type: 'pmp' });

        const result = await run();

        expect(result.securityTxt).toBe('yes');
    });

    it('should leave securityTxt no when none is found', async () => {
        const result = await run();

        expect(result.securityTxt).toBe('no');
    });

    it('should report securityTxt unknown when the lookup throws', async () => {
        mocks.fetchSecurityTxt.mockRejectedValue(new Error('rpc down'));

        const result = await run();

        expect(result.securityTxt).toBe('unknown');
    });
});

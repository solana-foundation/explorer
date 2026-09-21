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

import { getProgramProvenance } from '../get-program-provenance';

const PROGRAM_ID = address(gen.address(1));
// A throwaway rpc: every consumer of it is mocked, so its shape never matters.
const RPC = {} as Parameters<typeof getProgramProvenance>[0];

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
        mocks.resolveProgramIdls.mockResolvedValue({ anchorIdl: { name: 'jupiter_aggregator' } });

        const result = await run();

        expect(result.markers.idlUploaded).toBe(true);
        expect(result.name).toBe('Jupiter Aggregator');
    });

    it('should fall back to the program-metadata IDL metadata.name', async () => {
        mocks.resolveProgramIdls.mockResolvedValue({ programMetadataIdl: { metadata: { name: 'my-program' } } });

        const result = await run();

        expect(result.markers.idlUploaded).toBe(true);
        expect(result.name).toBe('My Program');
    });

    it('should leave idlUploaded false and the name absent when no IDL is published', async () => {
        const result = await run();

        expect(result.markers.idlUploaded).toBe(false);
        expect(result.name).toBeUndefined();
    });

    it('should fail soft to no IDL when the resolver throws', async () => {
        mocks.resolveProgramIdls.mockRejectedValue(new Error('rpc down'));

        const result = await run();

        expect(result.markers.idlUploaded).toBe(false);
        expect(result.name).toBeUndefined();
    });
});

describe('verified-build marker', () => {
    it('should mark verified when the registry reports a verified entry', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve({ json: () => Promise.resolve([{ is_verified: true }]), ok: true })),
        );

        const result = await run();

        expect(result.markers.verifiedBuild).toBe(true);
    });

    it('should not mark verified when the registry has no verified entry', async () => {
        const result = await run();

        expect(result.markers.verifiedBuild).toBe(false);
    });

    it('should skip the registry entirely on a cluster that has none', async () => {
        const result = await run(Cluster.Testnet);

        expect(result.markers.verifiedBuild).toBe(false);
        expect(fetch).not.toHaveBeenCalled();
    });

    it('should fail soft to unverified when the registry request throws', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.reject(new Error('network'))),
        );

        const result = await run();

        expect(result.markers.verifiedBuild).toBe(false);
    });

    it('should fail soft to unverified on a non-ok response', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve({ json: () => Promise.resolve([]), ok: false })),
        );

        const result = await run();

        expect(result.markers.verifiedBuild).toBe(false);
    });
});

describe('security.txt marker', () => {
    it('should mark securityTxt when one is resolved', async () => {
        mocks.fetchSecurityTxt.mockResolvedValue({ fields: {}, type: 'pmp' });

        const result = await run();

        expect(result.markers.securityTxt).toBe(true);
    });

    it('should leave securityTxt false when none is found', async () => {
        const result = await run();

        expect(result.markers.securityTxt).toBe(false);
    });

    it('should fail soft to no security.txt when the lookup throws', async () => {
        mocks.fetchSecurityTxt.mockRejectedValue(new Error('rpc down'));

        const result = await run();

        expect(result.markers.securityTxt).toBe(false);
    });
});

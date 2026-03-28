import { SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND, SolanaError } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

vi.mock('@/app/entities/program-metadata/api/getProgramCanonicalMetadata', async () => {
    const actual = await vi.importActual('@/app/entities/program-metadata/api/getProgramCanonicalMetadata');
    return {
        ...actual,
        getProgramCanonicalMetadata: vi.fn(),
    };
});

const mockAddress = PublicKey.default.toBase58();

describe('GET /api/program-metadata-idl', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 400 when required params are missing', async () => {
        const { GET } = await importRoute();
        const cases = [
            createRequest(mockAddress, Cluster.Devnet), // missing seed
            createRequest(mockAddress, undefined, 'idl'), // missing cluster
            createRequest(undefined, Cluster.Devnet, 'idl'), // missing programAddress
        ];

        const responses = await Promise.all(cases.map(r => GET(r)));
        for (const res of responses) {
            expect(res.status).toBe(400);
            expect(await res.json()).toEqual({ error: 'Invalid query params' });
        }
    });

    it('should return 400 for an invalid program address', async () => {
        const { GET } = await importRoute();
        const res = await GET(createRequest('not-a-pubkey', Cluster.MainnetBeta, 'idl'));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'Invalid program address' });
    });

    it('should return 400 for an invalid cluster', async () => {
        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, 999 as Cluster, 'idl'));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'Invalid cluster' });
    });

    it('should return metadata on success', async () => {
        const mock = await mockGetProgramCanonicalMetadata();
        mock.mockResolvedValueOnce({ data: 'IDL content' });

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta, 'idl'));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ programMetadata: { data: 'IDL content' } });
        expect(res.headers.get('Cache-Control')).toContain('max-age=');
    });

    it('should return null when account-not-found SolanaError is thrown', async () => {
        const mock = await mockGetProgramCanonicalMetadata();
        mock.mockRejectedValueOnce(
            new SolanaError(SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND, { address: mockAddress }),
        );

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta, 'idl'));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ programMetadata: null });
    });

    it('should return 502 with generic message for unexpected errors', async () => {
        const mock = await mockGetProgramCanonicalMetadata();
        mock.mockRejectedValueOnce(new Error('RPC connection failed'));

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta, 'idl'));
        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ error: 'Metadata fetch failed' });
    });

    it('should return 502 for unexpected SolanaErrors', async () => {
        const mock = await mockGetProgramCanonicalMetadata();
        mock.mockRejectedValueOnce(new SolanaError(32300001, { addresses: [mockAddress] }));

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta, 'idl'));
        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ error: 'Metadata fetch failed' });
    });
});

function createRequest(address?: string, cluster?: Cluster, seed?: string) {
    const params = new URLSearchParams();
    if (address !== undefined) params.append('programAddress', address);
    if (cluster !== undefined) params.append('cluster', cluster.toString());
    if (seed !== undefined) params.append('seed', seed);
    return new Request(`http://localhost:3000/api/program-metadata-idl?${params}`);
}

async function importRoute() {
    return await import('../route');
}

async function mockGetProgramCanonicalMetadata() {
    const mod = await import('@/app/entities/program-metadata/api/getProgramCanonicalMetadata');
    return vi.mocked(mod.getProgramCanonicalMetadata);
}

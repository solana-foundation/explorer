import { PublicKey } from '@solana/web3.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

vi.mock('@/app/entities/program-metadata/api/getProgramCanonicalMetadata', () => ({
    getProgramCanonicalMetadata: vi.fn().mockImplementation((_programAddress: string, seed: string, _url: string) => {
        if (seed === 'idl') {
            return Promise.resolve({ data: 'Idl data' });
        }
        if (seed === 'security') {
            return Promise.resolve({ data: 'SecurityTXT data' });
        }
        return Promise.resolve(null);
    }),
}));

async function importRoute() {
    return await import('../route');
}
const mockAddress = PublicKey.default.toBase58();

function createRequest(address?: string, cluster?: Cluster, seed?: string) {
    const params = new URLSearchParams();
    if (address) params.append('programAddress', address);
    if (cluster) params.append('cluster', cluster.toString());
    if (seed) params.append('seed', seed);
    return new Request(`http://localhost:3000/api/programMetadataIdl?${params.toString()}`);
}

describe('GET api/programMetadataIdl', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should reject when seed, programAddress or cluster  were not provided', async () => {
        const { GET } = await importRoute();
        const request1 = createRequest(mockAddress, Cluster.Devnet); // missing seed
        const request2 = createRequest(mockAddress, undefined, 'idl'); // missing cluster
        const request3 = createRequest(undefined, Cluster.Devnet, 'idl'); // missing programAddress

        const res = await Promise.all([GET(request1), GET(request2), GET(request3)]);
        for (const r of res) {
            expect(r.status).toBe(400);
            const data = await r.json();
            expect(data.error).toBe('Invalid query params');
        }
    });

    it('should reject when cluster is invalid', async () => {
        const { GET } = await importRoute();
        const request = createRequest(mockAddress, 999 as any, 'idl');
        const res = await GET(request);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Invalid cluster');
    });

    it('should handle errors from getProgramCanonicalMetadata call', async () => {
        const { GET } = await importRoute();
        const spy = vi.spyOn(
            await import('@/app/entities/program-metadata/api/getProgramCanonicalMetadata'),
            'getProgramCanonicalMetadata'
        );
        const expectedError = new Error('Request failed!');
        spy.mockImplementationOnce(() => {
            throw expectedError;
        });

        const request = createRequest(mockAddress, Cluster.Devnet, 'idl');
        const res = await GET(request);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.error).toEqual(expectedError.message);
    });

    it('should return success result for idl seed', async () => {
        const { GET } = await importRoute();
        const request = createRequest(mockAddress, Cluster.Devnet, 'idl');
        const res = await GET(request);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ programMetadata: { data: 'Idl data' } });
    });

    it('should return success result for security seed', async () => {
        const { GET } = await importRoute();
        const request = createRequest(mockAddress, Cluster.Devnet, 'security');
        const res = await GET(request);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ programMetadata: { data: 'SecurityTXT data' } });
    });
});

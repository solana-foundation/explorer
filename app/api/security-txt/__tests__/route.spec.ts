import { SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, SolanaError } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';

const mocks = vi.hoisted(() => ({
    resolvePmpIdl: vi.fn(),
}));

// The route delegates the PMP lookup to the shared resolvePmpIdl helper. We mock it to assert the
// route always stays canonical-only (security.txt has no fallback authority), response shaping, and
// error classification.
vi.mock('@/app/entities/idl/server', async () => {
    const actual = await vi.importActual<typeof import('@/app/entities/idl/server')>('@/app/entities/idl/server');
    return { ...actual, resolvePmpIdl: mocks.resolvePmpIdl };
});

const mockAddress = PublicKey.default.toBase58();

describe('GET /api/security-txt', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(Logger, 'panic').mockImplementation(() => {});
        vi.spyOn(Logger, 'warn').mockImplementation(() => {});
    });

    it('should return 400 when required params are missing', async () => {
        const { GET } = await importRoute();
        const cases = [
            createRequest(mockAddress, undefined), // missing cluster
            createRequest(undefined, Cluster.Devnet), // missing programAddress
        ];

        const responses = await Promise.all(cases.map(r => GET(r)));
        for (const res of responses) {
            expect(res.status).toBe(400);
            expect(await res.json()).toEqual({ error: 'Invalid query params' });
        }
    });

    it('should return 400 for an invalid program address', async () => {
        const { GET } = await importRoute();
        const res = await GET(createRequest('not-a-pubkey', Cluster.MainnetBeta));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'Invalid program address' });
    });

    it('should return 400 for an invalid cluster', async () => {
        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, 999 as Cluster));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'Invalid cluster' });
    });

    it('should return parsed security.txt on success', async () => {
        mocks.resolvePmpIdl.mockResolvedValueOnce({
            address: mockAddress,
            authority: null,
            content: JSON.stringify({ contacts: 'mailto:security@example.com' }),
        });

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ programMetadata: { contacts: 'mailto:security@example.com' } });
        expect(res.headers.get('Cache-Control')).toContain('max-age=');
    });

    it('should return null when no security.txt is published', async () => {
        mocks.resolvePmpIdl.mockResolvedValueOnce(null);

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ programMetadata: null });
    });

    it('should return null when the on-chain content is not valid JSON', async () => {
        mocks.resolvePmpIdl.mockResolvedValueOnce({ address: mockAddress, authority: null, content: 'not-json{' });

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ programMetadata: null });
    });

    it('should resolve the security seed canonical-only (no fallback authorities)', async () => {
        mocks.resolvePmpIdl.mockResolvedValueOnce(null);

        const { GET } = await importRoute();
        await GET(createRequest(mockAddress, Cluster.MainnetBeta));

        // 3rd arg = seed, 4th arg `false` → canonical authority only, no fndn fallback lookups.
        const call = mocks.resolvePmpIdl.mock.calls[0];
        expect(call[2]).toBe('security');
        expect(call[3]).toBe(false);
    });

    it('should return a retryable 502 (no page) on a transient RPC error', async () => {
        mocks.resolvePmpIdl.mockRejectedValueOnce(
            new SolanaError(SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, { __serverMessage: 'Internal error' }),
        );

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta));
        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ error: 'Upstream RPC error' });
        expect(Logger.warn).toHaveBeenCalled();
        expect(Logger.panic).not.toHaveBeenCalled();
    });

    it('should return 502 and escalate when the fetch unexpectedly throws', async () => {
        mocks.resolvePmpIdl.mockRejectedValueOnce(new Error('RPC connection failed'));

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta));
        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ error: 'Metadata fetch failed' });
        expect(Logger.panic).toHaveBeenCalled();
    });
});

function createRequest(address?: string, cluster?: Cluster) {
    const params = new URLSearchParams();
    if (address !== undefined) params.append('programAddress', address);
    if (cluster !== undefined) params.append('cluster', cluster.toString());
    return new Request(`http://localhost:3000/api/security-txt?${params}`);
}

async function importRoute() {
    return await import('../route');
}

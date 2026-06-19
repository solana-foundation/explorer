import { SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, SolanaError } from '@solana/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';

const mockAddress = '11111111111111111111111111111111';

const mocks = vi.hoisted(() => ({
    fetchPmpIdl: vi.fn(),
}));

// The route resolves the `security` seed via `@solana/idl`'s `fetchPmpIdl`. We mock that fetcher
// (keeping the real `unwrapIdl` / `isTransientRpcError`) to assert canonical-only resolution,
// response shaping, and error classification.
vi.mock('@solana/idl', async () => {
    const actual = await vi.importActual<typeof import('@solana/idl')>('@solana/idl');
    return { ...actual, fetchPmpIdl: mocks.fetchPmpIdl };
});

vi.mock('@solana/kit', async () => {
    const actual = await vi.importActual<typeof import('@solana/kit')>('@solana/kit');
    return { ...actual, createSolanaRpc: vi.fn(() => ({})) };
});

const pmpOk = (content: string) => ({ address: mockAddress, authority: null, content, source: 'pmp', status: 'ok' });

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
        expect(mocks.fetchPmpIdl).not.toHaveBeenCalled();
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
        mocks.fetchPmpIdl.mockResolvedValueOnce(pmpOk(JSON.stringify({ contacts: 'mailto:security@example.com' })));

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ programMetadata: { contacts: 'mailto:security@example.com' } });
        expect(res.headers.get('Cache-Control')).toContain('max-age=');
    });

    it('should return null when no security.txt is published', async () => {
        mocks.fetchPmpIdl.mockResolvedValueOnce({ address: mockAddress, status: 'absent' });

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ programMetadata: null });
    });

    it('should return null when the on-chain content is not valid JSON', async () => {
        mocks.fetchPmpIdl.mockResolvedValueOnce(pmpOk('not-json{'));

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ programMetadata: null });
    });

    it('should resolve the security seed canonical-only (no fallback authorities)', async () => {
        mocks.fetchPmpIdl.mockResolvedValueOnce({ address: mockAddress, status: 'absent' });

        const { GET } = await importRoute();
        await GET(createRequest(mockAddress, Cluster.MainnetBeta));

        // authority: null → canonical authority only, no fndn fallback lookups.
        expect(mocks.fetchPmpIdl).toHaveBeenCalledWith(expect.anything(), mockAddress, {
            authority: null,
            seed: 'security',
        });
    });

    it('should return a retryable 502 (no page) on a transient RPC error', async () => {
        mocks.fetchPmpIdl.mockRejectedValueOnce(
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
        mocks.fetchPmpIdl.mockRejectedValueOnce(new Error('RPC connection failed'));

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

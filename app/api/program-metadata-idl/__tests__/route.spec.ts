import { SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, SolanaError } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';

const mocks = vi.hoisted(() => ({
    resolvePmpIdl: vi.fn(),
}));

// The route delegates the PMP lookup (canonical + non-canonical fallback authorities, with
// not-found/transient classification) to the shared resolvePmpIdl helper. We mock it to assert the
// route's seed→fallback gating, response shaping, and error classification.
vi.mock('@/app/entities/idl/server', async () => {
    const actual = await vi.importActual<typeof import('@/app/entities/idl/server')>('@/app/entities/idl/server');
    return { ...actual, resolvePmpIdl: mocks.resolvePmpIdl };
});

const mockAddress = PublicKey.default.toBase58();

describe('GET /api/program-metadata-idl', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(Logger, 'panic').mockImplementation(() => {});
        vi.spyOn(Logger, 'warn').mockImplementation(() => {});
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

    it('should return parsed metadata on success', async () => {
        mocks.resolvePmpIdl.mockResolvedValueOnce({
            address: mockAddress,
            authority: null,
            content: JSON.stringify({ data: 'IDL content' }),
        });

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta, 'idl'));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ programMetadata: { data: 'IDL content' } });
        expect(res.headers.get('Cache-Control')).toContain('max-age=');
    });

    it('should return null when no PMP metadata is published', async () => {
        // resolvePmpIdl returns null for ACCOUNT_NOT_FOUND across every authority.
        mocks.resolvePmpIdl.mockResolvedValueOnce(null);

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta, 'idl'));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ programMetadata: null });
    });

    it('should return null when the on-chain content is not valid JSON', async () => {
        mocks.resolvePmpIdl.mockResolvedValueOnce({ address: mockAddress, authority: null, content: 'not-json{' });

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta, 'idl'));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ programMetadata: null });
    });

    it('should consult fallback authorities for the `idl` seed (enables native-program IDLs)', async () => {
        mocks.resolvePmpIdl.mockResolvedValueOnce(null);

        const { GET } = await importRoute();
        await GET(createRequest(mockAddress, Cluster.MainnetBeta, 'idl'));

        // 4th arg `true` → resolvePmpIdl tries canonical then each IDL_FALLBACK_PMP_AUTHORITIES.
        const call = mocks.resolvePmpIdl.mock.calls[0];
        expect(call[2]).toBe('idl');
        expect(call[3]).toBe(true);
    });

    it('should stay canonical-only for non-IDL seeds (e.g. security)', async () => {
        mocks.resolvePmpIdl.mockResolvedValueOnce(null);

        const { GET } = await importRoute();
        await GET(createRequest(mockAddress, Cluster.MainnetBeta, 'security'));

        // 4th arg `false` → canonical authority only, no fallback lookups.
        const call = mocks.resolvePmpIdl.mock.calls[0];
        expect(call[2]).toBe('security');
        expect(call[3]).toBe(false);
    });

    it('should return a retryable 502 (no page) on a transient RPC error', async () => {
        mocks.resolvePmpIdl.mockRejectedValueOnce(
            new SolanaError(SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, { __serverMessage: 'Internal error' }),
        );

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta, 'idl'));
        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ error: 'Upstream RPC error' });
        expect(Logger.warn).toHaveBeenCalled();
        expect(Logger.panic).not.toHaveBeenCalled();
    });

    it('should return 502 and escalate when the fetch unexpectedly throws', async () => {
        mocks.resolvePmpIdl.mockRejectedValueOnce(new Error('RPC connection failed'));

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta, 'idl'));
        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ error: 'Metadata fetch failed' });
        expect(Logger.panic).toHaveBeenCalled();
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

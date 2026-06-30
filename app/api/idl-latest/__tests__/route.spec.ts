import { SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, SolanaError } from '@solana/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';

const PROGRAM_ADDRESS = 'C7QLEmDz81Usvy2sYa4xZSdA8EwEcYvZo8iuYZMaqXmj';

const mocks = vi.hoisted(() => ({
    resolveProgramIdls: vi.fn(),
}));

// Resolution lives in `resolveProgramIdls` (its own spec). The route is the transport edge, so we
// mock the resolver and exercise query parsing, response shaping, partial-failure logging, and the
// error-to-HTTP policy (classified with `@solana/idl`'s real `isTransientRpcError`).
vi.mock('@/app/entities/idl/server', async () => {
    const actual = await vi.importActual<typeof import('@/app/entities/idl/server')>('@/app/entities/idl/server');
    return { ...actual, resolveProgramIdls: mocks.resolveProgramIdls };
});

vi.mock('@solana/kit', async () => {
    const actual = await vi.importActual<typeof import('@solana/kit')>('@solana/kit');
    // The resolver is mocked and ignores the rpc handle, so a stub is enough.
    return { ...actual, createSolanaRpc: vi.fn(() => ({})) };
});

function resolved(
    overrides: Partial<
        Record<'anchorIdl' | 'anchorIdlAddress' | 'programMetadataIdl' | 'programMetadataIdlAddress', unknown>
    > = {},
) {
    return {
        anchorIdl: undefined,
        anchorIdlAddress: undefined,
        programMetadataIdl: undefined,
        programMetadataIdlAddress: undefined,
        ...overrides,
    };
}

describe('GET /api/idl-latest', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(Logger, 'warn').mockImplementation(() => {});
        vi.spyOn(Logger, 'panic').mockImplementation(() => {});
    });

    it('should return 400 when required params are missing', async () => {
        const { GET } = await importRoute();
        const cases = [
            createRequest({ cluster: String(Cluster.MainnetBeta) }), // missing programAddress
            createRequest({ programAddress: PROGRAM_ADDRESS }), // missing cluster
        ];
        const responses = await Promise.all(cases.map(r => GET(r)));
        for (const res of responses) {
            expect(res.status).toBe(400);
            expect(await res.json()).toEqual({ error: 'Invalid query params' });
        }
        expect(mocks.resolveProgramIdls).not.toHaveBeenCalled();
    });

    it('should return 400 for an invalid cluster value', async () => {
        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: '999', programAddress: PROGRAM_ADDRESS }));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'Invalid cluster' });
    });

    it('should return 400 for an invalid program address', async () => {
        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: 'not-a-pubkey' }));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'Invalid program address' });
    });

    it('should shape the resolver output into the payload with cache headers', async () => {
        mocks.resolveProgramIdls.mockResolvedValueOnce(
            resolved({
                anchorIdl: { name: 'anchor_idl' },
                anchorIdlAddress: 'AnchrPDA11111111111111111111111111111111111',
                programMetadataIdl: { name: 'pmp' },
                programMetadataIdlAddress: 'PmpPDA111111111111111111111111111111111111',
            }),
        );

        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: PROGRAM_ADDRESS }));

        expect(res.status).toBe(200);
        // Storage accounts are forwarded alongside each IDL (anchorIdlAddress → anchorAddress, etc.).
        expect(await res.json()).toEqual({
            idls: {
                anchor: { name: 'anchor_idl' },
                anchorAddress: 'AnchrPDA11111111111111111111111111111111111',
                programMetadata: { name: 'pmp' },
                programMetadataAddress: 'PmpPDA111111111111111111111111111111111111',
            },
        });
        expect(res.headers.get('Cache-Control')).toContain('max-age=');
    });

    it('should resolve IDLs for the program (both sources, no source options)', async () => {
        mocks.resolveProgramIdls.mockResolvedValueOnce(resolved({ programMetadataIdl: { name: 'pmp' } }));

        const { GET } = await importRoute();
        await GET(createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: PROGRAM_ADDRESS }));

        expect(mocks.resolveProgramIdls).toHaveBeenCalledWith(expect.anything(), PROGRAM_ADDRESS);
    });

    it('should return a retryable 502 (no page) when the resolver keeps throwing a transient RPC error', async () => {
        mocks.resolveProgramIdls.mockRejectedValue(
            new SolanaError(SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, { __serverMessage: 'Internal error' }),
        );

        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: PROGRAM_ADDRESS }));

        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ error: 'Upstream RPC error' });
        // Transient errors are retried before giving up.
        expect(mocks.resolveProgramIdls).toHaveBeenCalledTimes(3);
        expect(Logger.warn).toHaveBeenCalled();
        expect(Logger.panic).not.toHaveBeenCalled();
    });

    it('should retry past a premature-close fetch error and succeed', async () => {
        mocks.resolveProgramIdls.mockRejectedValueOnce(
            Object.assign(new Error('Invalid response body ...: Premature close'), {
                code: 'ERR_STREAM_PREMATURE_CLOSE',
            }),
        );
        mocks.resolveProgramIdls.mockResolvedValueOnce(resolved({ anchorIdl: { name: 'a' } }));

        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: PROGRAM_ADDRESS }));

        expect(res.status).toBe(200);
        expect(mocks.resolveProgramIdls).toHaveBeenCalledTimes(2);
        expect(Logger.panic).not.toHaveBeenCalled();
    });

    it('should retry when the retryable code is nested in the error cause chain', async () => {
        // undici wraps the real failure as `cause` under a generic `TypeError: fetch failed`.
        mocks.resolveProgramIdls.mockRejectedValueOnce(
            Object.assign(new TypeError('fetch failed'), {
                cause: Object.assign(new Error('other side closed'), { code: 'UND_ERR_SOCKET' }),
            }),
        );
        mocks.resolveProgramIdls.mockResolvedValueOnce(resolved({ anchorIdl: { name: 'a' } }));

        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: PROGRAM_ADDRESS }));

        expect(res.status).toBe(200);
        expect(mocks.resolveProgramIdls).toHaveBeenCalledTimes(2);
        expect(Logger.panic).not.toHaveBeenCalled();
    });

    it('should return 502 and escalate on an unexpected (non-RPC) error', async () => {
        mocks.resolveProgramIdls.mockRejectedValueOnce(new Error('boom'));

        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: PROGRAM_ADDRESS }));

        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ error: 'Failed to resolve IDLs' });
        expect(Logger.panic).toHaveBeenCalled();
    });
});

function createRequest(params: Record<string, string> = {}) {
    const search = new URLSearchParams(params);
    return new Request(`http://localhost:3000/api/idl-latest?${search}`);
}

async function importRoute() {
    return await import('../route');
}

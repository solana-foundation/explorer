import { SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, SolanaError } from '@solana/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';

const PROGRAM_ADDRESS = 'C7QLEmDz81Usvy2sYa4xZSdA8EwEcYvZo8iuYZMaqXmj';
const ANCHOR_ACCOUNT = 'BPFLoaderUpgradeab1e11111111111111111111111';
const PMP_ACCOUNT = 'Stake11111111111111111111111111111111111111';

const mocks = vi.hoisted(() => ({
    lastWriteSlot: vi.fn(),
    resolveAnchorIdl: vi.fn(),
    resolvePmpIdl: vi.fn(),
}));

// The route delegates per-source fetch to the shared helpers and classifies RPC errors with
// `@solana/idl`'s real `isTransientRpcError`. We mock the three resolve helpers to exercise the
// route's isolation, response shaping, preferred-tab logic, and error handling.
vi.mock('@/app/entities/idl/server', async () => {
    const actual = await vi.importActual<typeof import('@/app/entities/idl/server')>('@/app/entities/idl/server');
    return {
        ...actual,
        lastWriteSlot: mocks.lastWriteSlot,
        resolveAnchorIdl: mocks.resolveAnchorIdl,
        resolvePmpIdl: mocks.resolvePmpIdl,
    };
});

vi.mock('@solana/kit', async () => {
    const actual = await vi.importActual<typeof import('@solana/kit')>('@solana/kit');
    return {
        ...actual,
        // The resolve helpers are mocked and ignore the rpc handle, so a stub is enough.
        createSolanaRpc: vi.fn(() => ({})),
    };
});

describe('GET /api/idl-latest', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(Logger, 'warn').mockImplementation(() => {});
        vi.spyOn(Logger, 'panic').mockImplementation(() => {});
        mocks.lastWriteSlot.mockResolvedValue(undefined);
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

    it('should map both sources and the preferred tab into the payload', async () => {
        mocks.resolveAnchorIdl.mockResolvedValueOnce({ address: ANCHOR_ACCOUNT, idl: { name: 'anchor_idl' } });
        mocks.resolvePmpIdl.mockResolvedValueOnce({
            address: PMP_ACCOUNT,
            authority: null,
            content: JSON.stringify({ name: 'pmp' }),
        });
        // Anchor written more recently than PMP → anchor preferred.
        mocks.lastWriteSlot.mockResolvedValueOnce(200n).mockResolvedValueOnce(100n);

        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: PROGRAM_ADDRESS }));

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
            idls: {
                anchor: { name: 'anchor_idl' },
                preferred: 'anchor',
                programMetadata: { name: 'pmp' },
            },
        });
        expect(res.headers.get('Cache-Control')).toContain('max-age=');
    });

    it('should prefer program-metadata when PMP was written at least as recently as Anchor', async () => {
        mocks.resolveAnchorIdl.mockResolvedValueOnce({ address: ANCHOR_ACCOUNT, idl: { name: 'a' } });
        mocks.resolvePmpIdl.mockResolvedValueOnce({
            address: PMP_ACCOUNT,
            authority: null,
            content: JSON.stringify({ name: 'p' }),
        });
        mocks.lastWriteSlot.mockResolvedValueOnce(100n).mockResolvedValueOnce(100n); // tie → PMP

        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: PROGRAM_ADDRESS }));
        const { idls } = await res.json();
        expect(idls.preferred).toBe('program-metadata');
    });

    it('should still surface the PMP IDL when the Anchor source is undecodable (isolation)', async () => {
        // resolveAnchorIdl returns null for a corrupt/undecodable Anchor account (it swallows decode
        // errors). The PMP IDL must NOT be discarded — the regression this guards against.
        mocks.resolveAnchorIdl.mockResolvedValueOnce(null);
        mocks.resolvePmpIdl.mockResolvedValueOnce({
            address: PMP_ACCOUNT,
            authority: null,
            content: JSON.stringify({ name: 'pmp' }),
        });

        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: PROGRAM_ADDRESS }));

        expect(res.status).toBe(200);
        const { idls } = await res.json();
        expect(idls.anchor).toBeUndefined();
        expect(idls.programMetadata).toEqual({ name: 'pmp' });
        expect(idls.preferred).toBe('program-metadata');
    });

    it('should skip the Anchor lookup for native/builtin programs but still resolve PMP IDLs', async () => {
        // The System program is in NON_ANCHOR_PROGRAMS: it definitionally has no Anchor IDL, and some
        // RPCs (SIMD-296) return transient errors instead of null for its derived PDA. We must not
        // call resolveAnchorIdl for it, but its Foundation-published PMP IDL must still surface.
        const SYSTEM_PROGRAM = '11111111111111111111111111111111';
        mocks.resolvePmpIdl.mockResolvedValueOnce({
            address: PMP_ACCOUNT,
            authority: null,
            content: JSON.stringify({ name: 'native_idl' }),
        });

        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: SYSTEM_PROGRAM }));

        expect(res.status).toBe(200);
        const { idls } = await res.json();
        expect(mocks.resolveAnchorIdl).not.toHaveBeenCalled();
        expect(idls.anchor).toBeUndefined();
        expect(idls.programMetadata).toEqual({ name: 'native_idl' });
        expect(idls.preferred).toBe('program-metadata');
    });

    it('should still serve a resolved PMP IDL when the Anchor lookup hits a transient RPC error', async () => {
        // A genuine RPC error on ONE source must not discard the sources that resolved. The card
        // still shows the PMP IDL; the transient failure is logged (warn), not paged, and no 502.
        mocks.resolveAnchorIdl.mockRejectedValueOnce(
            new SolanaError(SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, { __serverMessage: 'Internal error' }),
        );
        mocks.resolvePmpIdl.mockResolvedValueOnce({
            address: PMP_ACCOUNT,
            authority: null,
            content: JSON.stringify({ name: 'pmp' }),
        });

        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: PROGRAM_ADDRESS }));

        expect(res.status).toBe(200);
        const { idls } = await res.json();
        expect(idls.anchor).toBeUndefined();
        expect(idls.programMetadata).toEqual({ name: 'pmp' });
        expect(idls.preferred).toBe('program-metadata');
        expect(Logger.warn).toHaveBeenCalled();
        expect(Logger.panic).not.toHaveBeenCalled();
    });

    it('should prefer Anchor when both IDLs exist but only the Anchor write-slot is known', async () => {
        mocks.resolveAnchorIdl.mockResolvedValueOnce({ address: ANCHOR_ACCOUNT, idl: { name: 'a' } });
        mocks.resolvePmpIdl.mockResolvedValueOnce({
            address: PMP_ACCOUNT,
            authority: null,
            content: JSON.stringify({ name: 'p' }),
        });
        // Anchor write-slot resolves; the PMP write-slot lookup yields nothing (undefined).
        mocks.lastWriteSlot.mockResolvedValueOnce(123n).mockResolvedValueOnce(undefined);

        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: PROGRAM_ADDRESS }));
        const { idls } = await res.json();
        expect(idls.preferred).toBe('anchor');
    });

    it('should drop content that is not valid JSON to undefined', async () => {
        mocks.resolveAnchorIdl.mockResolvedValueOnce(null);
        mocks.resolvePmpIdl.mockResolvedValueOnce({ address: PMP_ACCOUNT, authority: null, content: 'not-json{' });

        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: PROGRAM_ADDRESS }));
        const { idls } = await res.json();
        expect(idls.programMetadata).toBeUndefined();
    });

    it('should only fetch the Anchor IDL (and prefer it) when pmp=0', async () => {
        mocks.resolveAnchorIdl.mockResolvedValueOnce({ address: ANCHOR_ACCOUNT, idl: { name: 'a' } });

        const { GET } = await importRoute();
        const res = await GET(
            createRequest({ cluster: String(Cluster.MainnetBeta), pmp: '0', programAddress: PROGRAM_ADDRESS }),
        );

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
            idls: { anchor: { name: 'a' }, preferred: 'anchor', programMetadata: undefined },
        });
        expect(mocks.resolvePmpIdl).not.toHaveBeenCalled();
    });

    it('should only fetch the PMP IDL (and prefer it) when anchor=0', async () => {
        mocks.resolvePmpIdl.mockResolvedValueOnce({
            address: PMP_ACCOUNT,
            authority: null,
            content: JSON.stringify({ name: 'pmp' }),
        });

        const { GET } = await importRoute();
        const res = await GET(
            createRequest({ anchor: '0', cluster: String(Cluster.MainnetBeta), programAddress: PROGRAM_ADDRESS }),
        );

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
            idls: { anchor: undefined, preferred: 'program-metadata', programMetadata: { name: 'pmp' } },
        });
        expect(mocks.resolveAnchorIdl).not.toHaveBeenCalled();
        // Single source → no recency lookups.
        expect(mocks.lastWriteSlot).not.toHaveBeenCalled();
    });

    it('should return a retryable 502 (no page) on a transient RPC error', async () => {
        mocks.resolveAnchorIdl.mockRejectedValueOnce(
            new SolanaError(SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, { __serverMessage: 'Internal error' }),
        );
        mocks.resolvePmpIdl.mockResolvedValue(null);

        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: PROGRAM_ADDRESS }));

        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ error: 'Upstream RPC error' });
        expect(Logger.warn).toHaveBeenCalled();
        expect(Logger.panic).not.toHaveBeenCalled();
    });

    it('should return 502 and escalate on an unexpected (non-RPC) error', async () => {
        mocks.resolveAnchorIdl.mockRejectedValueOnce(new Error('boom'));
        mocks.resolvePmpIdl.mockResolvedValue(null);

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

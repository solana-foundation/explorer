import {
    SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR,
    SOLANA_ERROR__JSON_RPC__METHOD_NOT_FOUND,
    SOLANA_ERROR__RPC__API_PLAN_MISSING_FOR_RPC_METHOD,
    SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
    SOLANA_ERROR__RPC__TRANSPORT_HTTP_HEADER_FORBIDDEN,
    SolanaError,
} from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';

// A non-denylisted base58 address — random valid pubkey for tests that exercise RPC.
const ANCHOR_PROGRAM_ADDRESS = 'C7QLEmDz81Usvy2sYa4xZSdA8EwEcYvZo8iuYZMaqXmj';
// Arbitrary derived-PDA address returned alongside the IDL content by @solana/idl.
const IDL_ACCOUNT_ADDRESS = 'BPFLoaderUpgradeab1e11111111111111111111111';

const mocks = vi.hoisted(() => ({
    fetchAnchorIdl: vi.fn(),
}));

// The route delegates Anchor IDL fetch + decode (PDA derivation, account read, zlib inflate)
// to @solana/idl. We mock it to exercise the route's branching and error classification.
vi.mock('@solana/idl', () => ({
    fetchAnchorIdl: mocks.fetchAnchorIdl,
}));

vi.mock('@solana/kit', async () => {
    const actual = await vi.importActual<typeof import('@solana/kit')>('@solana/kit');
    return {
        ...actual,
        // fetchAnchorIdl is mocked and ignores the rpc handle, so a stub is enough.
        createSolanaRpc: vi.fn(() => ({})),
    };
});

describe('GET /api/anchor', () => {
    beforeEach(() => {
        mocks.fetchAnchorIdl.mockReset();
        vi.spyOn(Logger, 'warn').mockImplementation(() => {});
        vi.spyOn(Logger, 'panic').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return 400 when programAddress is missing', async () => {
        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta) }));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'Invalid query params' });
    });

    it('should return 400 when cluster is missing', async () => {
        const { GET } = await importRoute();
        const res = await GET(createRequest({ programAddress: ANCHOR_PROGRAM_ADDRESS }));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'Invalid query params' });
    });

    it('should return 400 for an invalid cluster value', async () => {
        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: '999', programAddress: ANCHOR_PROGRAM_ADDRESS }));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'Invalid cluster' });
    });

    it('should return 400 for an invalid program address', async () => {
        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: 'not-a-pubkey' }));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'Invalid program address' });
    });

    it('should short-circuit known non-Anchor programs without an RPC call', async () => {
        for (const address of [TOKEN_PROGRAM_ADDRESS, SYSTEM_PROGRAM_ADDRESS]) {
            const { GET } = await importRoute();
            const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: address }));
            expect(res.status).toBe(200);
            expect(await res.json()).toEqual({ idl: null });
            expect(res.headers.get('Cache-Control')).toContain('max-age=');
        }
        expect(mocks.fetchAnchorIdl).not.toHaveBeenCalled();
    });

    it('should return null IDL with 200 when no IDL account exists', async () => {
        mocks.fetchAnchorIdl.mockResolvedValueOnce(null);

        const { GET } = await importRoute();
        const res = await GET(
            createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: ANCHOR_PROGRAM_ADDRESS }),
        );

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ idl: null });
        expect(res.headers.get('Cache-Control')).toContain('max-age=');
    });

    it('should return parsed IDL when the account holds valid Anchor data', async () => {
        const fakeIdl = {
            address: ANCHOR_PROGRAM_ADDRESS,
            instructions: [],
            metadata: { name: 'test', spec: '0.1.0', version: '0.1.0' },
        };
        mocks.fetchAnchorIdl.mockResolvedValueOnce({
            address: IDL_ACCOUNT_ADDRESS,
            content: JSON.stringify(fakeIdl),
        });

        const { GET } = await importRoute();
        const res = await GET(
            createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: ANCHOR_PROGRAM_ADDRESS }),
        );

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ idl: fakeIdl });
        expect(res.headers.get('Cache-Control')).toContain('max-age=');
    });

    it('should return null IDL with 200 when the account content is not valid JSON', async () => {
        mocks.fetchAnchorIdl.mockResolvedValueOnce({ address: IDL_ACCOUNT_ADDRESS, content: 'not-json{' });

        const { GET } = await importRoute();
        const res = await GET(
            createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: ANCHOR_PROGRAM_ADDRESS }),
        );

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ idl: null });
        expect(Logger.warn).toHaveBeenCalled();
        expect(Logger.panic).not.toHaveBeenCalled();
    });

    it('should return null IDL with 200 when decoding throws a non-RPC error (corrupt account bytes)', async () => {
        // @solana/idl throws (e.g. zlib inflate failure) when an account is present but its bytes
        // are not a valid Anchor IDL payload. Treat as non-Anchor and cache the negative result.
        mocks.fetchAnchorIdl.mockRejectedValueOnce(new Error('incorrect header check'));

        const { GET } = await importRoute();
        const res = await GET(
            createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: ANCHOR_PROGRAM_ADDRESS }),
        );

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ idl: null });
        expect(Logger.warn).toHaveBeenCalled();
        expect(Logger.panic).not.toHaveBeenCalled();
    });

    it('should return 502 without escalating on a transient JSON-RPC error (Internal error)', async () => {
        const rpcError = new SolanaError(SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, {
            __serverMessage: 'Internal error',
        });
        mocks.fetchAnchorIdl.mockRejectedValueOnce(rpcError);

        const { GET } = await importRoute();
        const res = await GET(
            createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: ANCHOR_PROGRAM_ADDRESS }),
        );

        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ error: 'Upstream RPC error' });
        expect(Logger.warn).toHaveBeenCalled();
        expect(Logger.panic).not.toHaveBeenCalled();
    });

    it.each([
        ['HTTP 500 upstream sick', 500],
        ['HTTP 502 bad gateway', 502],
        ['HTTP 503 service unavailable', 503],
        ['HTTP 429 rate-limited backpressure', 429],
    ])('should treat %s as transient and warn without escalating', async (_label, statusCode) => {
        const rpcError = new SolanaError(SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR, {
            headers: new Headers(),
            message: 'upstream',
            statusCode,
        });
        mocks.fetchAnchorIdl.mockRejectedValueOnce(rpcError);

        const { GET } = await importRoute();
        const res = await GET(
            createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: ANCHOR_PROGRAM_ADDRESS }),
        );

        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ error: 'Upstream RPC error' });
        expect(Logger.warn).toHaveBeenCalled();
        expect(Logger.panic).not.toHaveBeenCalled();
    });

    it.each([
        ['HTTP 401 wrong RPC token', 401],
        ['HTTP 403 forbidden', 403],
        ['HTTP 404 wrong endpoint', 404],
    ])('should escalate %s as misconfiguration', async (_label, statusCode) => {
        const rpcError = new SolanaError(SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR, {
            headers: new Headers(),
            message: 'unauthorized',
            statusCode,
        });
        mocks.fetchAnchorIdl.mockRejectedValueOnce(rpcError);

        const { GET } = await importRoute();
        const res = await GET(
            createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: ANCHOR_PROGRAM_ADDRESS }),
        );

        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ error: 'Failed to fetch IDL' });
        expect(Logger.panic).toHaveBeenCalled();
        expect(Logger.warn).not.toHaveBeenCalled();
    });

    it('should escalate when the RPC reports a missing API plan', async () => {
        const rpcError = new SolanaError(SOLANA_ERROR__RPC__API_PLAN_MISSING_FOR_RPC_METHOD, {
            method: 'getAccountInfo',
            params: [],
        });
        mocks.fetchAnchorIdl.mockRejectedValueOnce(rpcError);

        const { GET } = await importRoute();
        const res = await GET(
            createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: ANCHOR_PROGRAM_ADDRESS }),
        );

        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ error: 'Failed to fetch IDL' });
        expect(Logger.panic).toHaveBeenCalled();
    });

    it('should escalate when a proxy strips required RPC headers', async () => {
        const rpcError = new SolanaError(SOLANA_ERROR__RPC__TRANSPORT_HTTP_HEADER_FORBIDDEN, {
            headers: ['Solana-Client'],
        });
        mocks.fetchAnchorIdl.mockRejectedValueOnce(rpcError);

        const { GET } = await importRoute();
        const res = await GET(
            createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: ANCHOR_PROGRAM_ADDRESS }),
        );

        expect(res.status).toBe(502);
        expect(Logger.panic).toHaveBeenCalled();
    });

    it('should escalate when the RPC reports an unknown method', async () => {
        const rpcError = new SolanaError(SOLANA_ERROR__JSON_RPC__METHOD_NOT_FOUND, {
            __serverMessage: 'Method not found',
        });
        mocks.fetchAnchorIdl.mockRejectedValueOnce(rpcError);

        const { GET } = await importRoute();
        const res = await GET(
            createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: ANCHOR_PROGRAM_ADDRESS }),
        );

        expect(res.status).toBe(502);
        expect(Logger.panic).toHaveBeenCalled();
    });

    it('should treat unexpected non-RPC errors as undecodable without leaking internals', async () => {
        // A non-SolanaError throw is not a recognized RPC failure; the route classifies it as a
        // present-but-undecodable account (200/null + warn) rather than paging on bad on-chain bytes.
        const internalError = Object.assign(new Error('AccountNotFoundError'), {
            context: { rpcUrl: 'https://internal-rpc.company.com:8899' },
            logs: ['Program log: secret stuff'],
        });
        mocks.fetchAnchorIdl.mockRejectedValueOnce(internalError);

        const { GET } = await importRoute();
        const res = await GET(
            createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: ANCHOR_PROGRAM_ADDRESS }),
        );

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toEqual({ idl: null });
        expect(Logger.warn).toHaveBeenCalled();
        expect(Logger.panic).not.toHaveBeenCalled();

        // Verify no internal details leaked into the response body.
        const bodyStr = JSON.stringify(body);
        expect(bodyStr).not.toContain('internal-rpc.company.com');
        expect(bodyStr).not.toContain('secret stuff');
    });
});

function createRequest(params: Record<string, string> = {}) {
    const searchParams = new URLSearchParams(params);
    return new Request(`http://localhost:3000/api/anchor?${searchParams}`);
}

async function importRoute() {
    return await import('../route');
}

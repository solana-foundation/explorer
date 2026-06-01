import type { Idl } from '@coral-xyz/anchor';
import { encodeIdlAccount as encodeIdlAccountBorsh } from '@coral-xyz/anchor/dist/cjs/idl';
import {
    getBase64Decoder,
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
import { deflateSync } from 'zlib';

import { Logger } from '@/app/shared/lib/logger';
import { toLegacyPublicKey } from '@/app/shared/lib/web3js-compat';
import { Cluster } from '@/app/utils/cluster';

// A non-denylisted base58 address — random valid pubkey for tests that exercise RPC.
const ANCHOR_PROGRAM_ADDRESS = 'C7QLEmDz81Usvy2sYa4xZSdA8EwEcYvZo8iuYZMaqXmj';

const mocks = vi.hoisted(() => ({
    sendGetAccountInfo: vi.fn(),
}));

vi.mock('@solana/kit', async () => {
    const actual = await vi.importActual<typeof import('@solana/kit')>('@solana/kit');
    return {
        ...actual,
        createSolanaRpc: vi.fn(() => ({
            getAccountInfo: () => ({ send: mocks.sendGetAccountInfo }),
        })),
    };
});

describe('GET /api/anchor', () => {
    beforeEach(() => {
        mocks.sendGetAccountInfo.mockReset();
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
        expect(mocks.sendGetAccountInfo).not.toHaveBeenCalled();
    });

    it('should return null IDL with 200 when no IDL account exists', async () => {
        mocks.sendGetAccountInfo.mockResolvedValueOnce({ context: { slot: 0n }, value: null });

        const { GET } = await importRoute();
        const res = await GET(
            createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: ANCHOR_PROGRAM_ADDRESS }),
        );

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ idl: null });
        expect(res.headers.get('Cache-Control')).toContain('max-age=');
    });

    it('should return parsed IDL when the account holds valid Anchor data', async () => {
        const fakeIdl: Idl = {
            address: ANCHOR_PROGRAM_ADDRESS,
            instructions: [],
            metadata: { name: 'test', spec: '0.1.0', version: '0.1.0' },
        };
        mocks.sendGetAccountInfo.mockResolvedValueOnce({
            context: { slot: 0n },
            value: accountValue(encodeIdlAccount(fakeIdl)),
        });

        const { GET } = await importRoute();
        const res = await GET(
            createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: ANCHOR_PROGRAM_ADDRESS }),
        );

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ idl: fakeIdl });
        expect(res.headers.get('Cache-Control')).toContain('max-age=');
    });

    it('should return null IDL with 200 when account data is undecodable', async () => {
        // Garbage bytes — fails inflate / JSON.parse rather than the truncated-buffer path.
        const garbage = new Uint8Array(8 + 32 + 4 + 16).fill(0xff);
        new DataView(garbage.buffer).setUint32(8 + 32, 16, true);
        mocks.sendGetAccountInfo.mockResolvedValueOnce({
            context: { slot: 0n },
            value: accountValue(garbage),
        });

        const { GET } = await importRoute();
        const res = await GET(
            createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: ANCHOR_PROGRAM_ADDRESS }),
        );

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ idl: null });
        expect(Logger.warn).toHaveBeenCalled();
        expect(Logger.panic).not.toHaveBeenCalled();
    });

    it('should return null IDL with 200 when the decoded JSON is not Idl-shaped', async () => {
        // Well-formed JSON object at the IDL PDA, but missing `instructions: []`. The shape
        // guard inside decodeIdl rejects it so we don't cache garbage as a valid IDL.
        mocks.sendGetAccountInfo.mockResolvedValueOnce({
            context: { slot: 0n },
            value: accountValue(encodeIdlAccount({ hello: 'world' })),
        });

        const { GET } = await importRoute();
        const res = await GET(
            createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: ANCHOR_PROGRAM_ADDRESS }),
        );

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ idl: null });
        expect(Logger.warn).toHaveBeenCalled();
        expect(Logger.panic).not.toHaveBeenCalled();
    });

    it('should return null IDL with 200 when the account is shorter than the Anchor discriminator', async () => {
        // 4 bytes < 8-byte discriminator → Buffer.from(buf, 8, -4) throws RangeError
        // before borsh ever sees the bytes. Caught by the route's outer try/catch.
        mocks.sendGetAccountInfo.mockResolvedValueOnce({
            context: { slot: 0n },
            value: accountValue(new Uint8Array(4)),
        });

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
        mocks.sendGetAccountInfo.mockRejectedValueOnce(rpcError);

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
        mocks.sendGetAccountInfo.mockRejectedValueOnce(rpcError);

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
        mocks.sendGetAccountInfo.mockRejectedValueOnce(rpcError);

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
        mocks.sendGetAccountInfo.mockRejectedValueOnce(rpcError);

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
        mocks.sendGetAccountInfo.mockRejectedValueOnce(rpcError);

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
        mocks.sendGetAccountInfo.mockRejectedValueOnce(rpcError);

        const { GET } = await importRoute();
        const res = await GET(
            createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: ANCHOR_PROGRAM_ADDRESS }),
        );

        expect(res.status).toBe(502);
        expect(Logger.panic).toHaveBeenCalled();
    });

    it('should return 502 and escalate to Sentry on truly unexpected errors', async () => {
        const internalError = Object.assign(new Error('AccountNotFoundError'), {
            context: { rpcUrl: 'https://internal-rpc.company.com:8899' },
            logs: ['Program log: secret stuff'],
        });
        mocks.sendGetAccountInfo.mockRejectedValueOnce(internalError);

        const { GET } = await importRoute();
        const res = await GET(
            createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: ANCHOR_PROGRAM_ADDRESS }),
        );

        expect(res.status).toBe(502);
        const body = await res.json();
        expect(body).toEqual({ error: 'Failed to fetch IDL' });
        expect(Logger.panic).toHaveBeenCalled();

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

// Build a full IDL account: [8-byte Anchor discriminator] + borsh-encoded { authority, data }
// where data is zlib(JSON-stringified payload). The discriminator bytes are arbitrary — the
// route slices them off before decoding. Accepts arbitrary payloads so callers can also
// build accounts whose JSON is well-formed but not Idl-shaped.
function encodeIdlAccount(payload: unknown): Uint8Array {
    const compressed = deflateSync(new TextEncoder().encode(JSON.stringify(payload)));
    const body = encodeIdlAccountBorsh({
        authority: toLegacyPublicKey(SYSTEM_PROGRAM_ADDRESS),
        data: compressed,
    });
    const buf = new Uint8Array(8 + body.length);
    buf.set(body, 8);
    return buf;
}

// Shape the JSON-RPC `getAccountInfo` value with `encoding: 'base64'` returns.
function accountValue(data: Uint8Array) {
    return {
        data: [getBase64Decoder().decode(data), 'base64'] as const,
        executable: false,
        lamports: 0n,
        owner: SYSTEM_PROGRAM_ADDRESS,
        rentEpoch: 0n,
        space: BigInt(data.length),
    };
}

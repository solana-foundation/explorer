import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gen } from '@/app/__fixtures__/gen';
import { TokenInfoHttpError, TokenInfoInvalidResponseError } from '@/app/entities/token-info';
import type { TokenInfo } from '@/app/entities/token-info/server';
import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';

import { MAX_ADDRESSES } from '../config';

// The route treats a mint as an opaque, well-formed address, so generated ones say more about
// what is under test than real mints would.
const MINT_A = gen.address(1);
const MINT_B = gen.address(2);
const MINT_C = gen.address(3);

const mocks = vi.hoisted(() => ({
    getTokenInfos: vi.fn(),
    getTokenInfosFromMetaplex: vi.fn(),
    safeFetchAllMetadata: vi.fn(),
}));

// The Jupiter lookup and the Metaplex fallback each have their own spec. The route is the transport
// edge, so both are mocked here to exercise body parsing, the address cap, response shaping, and the
// opt-in fallback policy. `isValidCluster` stays real so cluster handling is exercised end to end.
vi.mock('@entities/token-info/server', async () => {
    const actual = await vi.importActual<typeof import('@entities/token-info/server')>('@entities/token-info/server');
    return {
        ...actual,
        getTokenInfos: mocks.getTokenInfos,
        getTokenInfosFromMetaplex: mocks.getTokenInfosFromMetaplex,
    };
});

vi.mock('@metaplex-foundation/mpl-token-metadata', async importOriginal => ({
    ...(await importOriginal<typeof import('@metaplex-foundation/mpl-token-metadata')>()),
    safeFetchAllMetadata: mocks.safeFetchAllMetadata,
}));

function token(address: string, overrides: Partial<TokenInfo> = {}): TokenInfo {
    return {
        address,
        decimals: 6,
        logoURI: null,
        name: `Token ${address.slice(0, 4)}`,
        symbol: 'TKN',
        verified: true,
        ...overrides,
    };
}

describe('POST /api/token-info', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(Logger, 'warn').mockImplementation(() => {});
        vi.spyOn(Logger, 'error').mockImplementation(() => {});
        mocks.getTokenInfos.mockResolvedValue(resolved([]));
        mocks.getTokenInfosFromMetaplex.mockResolvedValue([]);
    });

    it('should return 400 when the body is not valid JSON', async () => {
        const { POST } = await importRoute();
        const res = await POST(new Request('http://localhost:3000/api/token-info', { body: 'nope', method: 'POST' }));

        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'Invalid request' });
        expect(mocks.getTokenInfos).not.toHaveBeenCalled();
    });

    it('should return 400 when neither address nor addresses is given', async () => {
        const { POST } = await importRoute();
        const res = await POST(createRequest({ cluster: Cluster.MainnetBeta }));

        expect(res.status).toBe(400);
        expect(mocks.getTokenInfos).not.toHaveBeenCalled();
    });

    it('should return 400 for a malformed address', async () => {
        const { POST } = await importRoute();
        const res = await POST(createRequest({ addresses: [MINT_A, 'not-a-pubkey'], cluster: Cluster.MainnetBeta }));

        expect(res.status).toBe(400);
        expect(mocks.getTokenInfos).not.toHaveBeenCalled();
    });

    it('should return 400 for an unsupported cluster', async () => {
        const { POST } = await importRoute();
        const res = await POST(createRequest({ addresses: [MINT_A], cluster: 999 }));

        expect(res.status).toBe(400);
        expect(mocks.getTokenInfos).not.toHaveBeenCalled();
    });

    it('should return 400 when the cluster is not a number', async () => {
        const { POST } = await importRoute();
        const res = await POST(createRequest({ addresses: [MINT_A], cluster: '0' }));

        expect(res.status).toBe(400);
        expect(mocks.getTokenInfos).not.toHaveBeenCalled();
    });

    it('should return 400 when the genesis hash is not a string', async () => {
        const { POST } = await importRoute();
        const res = await POST(createRequest({ addresses: [MINT_A], cluster: Cluster.Custom, genesisHash: 42 }));

        expect(res.status).toBe(400);
        expect(mocks.getTokenInfos).not.toHaveBeenCalled();
    });

    it('should ignore keys it does not know', async () => {
        const { POST } = await importRoute();
        const res = await POST(createRequest({ addresses: [MINT_A], cluster: Cluster.MainnetBeta, verbose: true }));

        expect(res.status).toBe(200);
    });

    it('should return 400 when more distinct addresses than the cap are requested', async () => {
        const { POST } = await importRoute();
        const addresses = Array.from({ length: MAX_ADDRESSES + 1 }, (_, i) => gen.address(i));
        const res = await POST(createRequest({ addresses, cluster: Cluster.MainnetBeta }));

        expect(res.status).toBe(400);
        expect(mocks.getTokenInfos).not.toHaveBeenCalled();
    });

    it('should accept a request whose repeats push it over the cap only before de-duplication', async () => {
        const { POST } = await importRoute();
        // A single transaction can move one mint through far more than `MAX_ADDRESSES` token
        // accounts; that must not be rejected, because it is one distinct lookup.
        const addresses = Array.from({ length: 400 }, () => MINT_A);
        const res = await POST(createRequest({ addresses, cluster: Cluster.MainnetBeta }));

        expect(res.status).toBe(200);
        expect(mocks.getTokenInfos).toHaveBeenCalledWith([MINT_A], Cluster.MainnetBeta, undefined, expect.anything());
    });

    it('should accept a single address and still answer with an array', async () => {
        mocks.getTokenInfos.mockResolvedValueOnce(resolved([token(MINT_A)]));

        const { POST } = await importRoute();
        const res = await POST(createRequest({ address: MINT_A, cluster: Cluster.MainnetBeta }));

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ content: [token(MINT_A)] });
        expect(mocks.getTokenInfos).toHaveBeenCalledWith([MINT_A], Cluster.MainnetBeta, undefined, expect.anything());
    });

    it('should answer without a Cache-Control header', async () => {
        mocks.getTokenInfos.mockResolvedValueOnce(resolved([token(MINT_A)]));

        const { POST } = await importRoute();
        const res = await POST(createRequest({ address: MINT_A, cluster: Cluster.MainnetBeta }));

        expect(res.status).toBe(200);
        expect(res.headers.get('Cache-Control')).toBeNull();
    });

    it('should resolve several addresses in one request', async () => {
        mocks.getTokenInfos.mockResolvedValueOnce(resolved([token(MINT_A), token(MINT_B)]));

        const { POST } = await importRoute();
        const res = await POST(createRequest({ addresses: [MINT_A, MINT_B], cluster: Cluster.MainnetBeta }));

        expect(await res.json()).toEqual({ content: [token(MINT_A), token(MINT_B)] });
        expect(mocks.getTokenInfos).toHaveBeenCalledWith(
            [MINT_A, MINT_B],
            Cluster.MainnetBeta,
            undefined,
            expect.anything(),
        );
    });

    it('should de-duplicate repeated addresses', async () => {
        const { POST } = await importRoute();
        await POST(createRequest({ addresses: [MINT_A, MINT_A, MINT_B], cluster: Cluster.MainnetBeta }));

        expect(mocks.getTokenInfos).toHaveBeenCalledWith(
            [MINT_A, MINT_B],
            Cluster.MainnetBeta,
            undefined,
            expect.anything(),
        );
    });

    it('should forward the genesis hash so a custom cluster can resolve a chain id', async () => {
        const genesisHash = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';

        const { POST } = await importRoute();
        const res = await POST(createRequest({ addresses: [MINT_A], cluster: Cluster.Custom, genesisHash }));

        expect(res.status).toBe(200);
        expect(mocks.getTokenInfos).toHaveBeenCalledWith([MINT_A], Cluster.Custom, genesisHash, expect.anything());
    });

    it('should not read on-chain metadata unless the caller opts in', async () => {
        mocks.getTokenInfos.mockResolvedValueOnce(resolved([]));

        const { POST } = await importRoute();
        const res = await POST(createRequest({ addresses: [MINT_A], cluster: Cluster.MainnetBeta }));

        expect(await res.json()).toEqual({ content: [] });
        expect(mocks.getTokenInfosFromMetaplex).not.toHaveBeenCalled();
    });

    it('should read on-chain metadata only for mints Jupiter does not list', async () => {
        mocks.getTokenInfos.mockResolvedValueOnce(resolved([token(MINT_A)]));
        mocks.getTokenInfosFromMetaplex.mockResolvedValueOnce([token(MINT_C, { verified: false })]);

        const { POST } = await importRoute();
        const res = await POST(
            createRequest({
                addresses: [MINT_A, MINT_B, MINT_C],
                cluster: Cluster.MainnetBeta,
                includeOnChainFallback: true,
            }),
        );

        // The endpoint is resolved from server config, and nothing is derived from the incoming
        // request — a caller-controlled Host must not be able to redirect the fallback's fetches.
        expect(mocks.getTokenInfosFromMetaplex).toHaveBeenCalledWith(
            [MINT_B, MINT_C],
            expect.any(String),
            expect.not.objectContaining({ baseUrl: expect.anything() }),
        );
        expect(await res.json()).toEqual({ content: [token(MINT_A), token(MINT_C, { verified: false })] });
    });

    it('should skip the on-chain lookup when Jupiter lists every mint', async () => {
        mocks.getTokenInfos.mockResolvedValueOnce(resolved([token(MINT_A), token(MINT_B)]));

        const { POST } = await importRoute();
        await POST(
            createRequest({
                addresses: [MINT_A, MINT_B],
                cluster: Cluster.MainnetBeta,
                includeOnChainFallback: true,
            }),
        );

        expect(mocks.getTokenInfosFromMetaplex).not.toHaveBeenCalled();
    });

    it('should still return the listed tokens when the on-chain lookup throws', async () => {
        mocks.getTokenInfos.mockResolvedValueOnce(resolved([token(MINT_A)]));
        mocks.getTokenInfosFromMetaplex.mockRejectedValueOnce(new Error('rpc exploded'));

        const { POST } = await importRoute();
        const res = await POST(
            createRequest({
                addresses: [MINT_A, MINT_B],
                cluster: Cluster.MainnetBeta,
                includeOnChainFallback: true,
            }),
        );

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ content: [token(MINT_A)] });
        expect(Logger.warn).toHaveBeenCalled();
    });

    it('should answer with an empty list for an empty addresses array', async () => {
        const { POST } = await importRoute();
        const res = await POST(createRequest({ addresses: [], cluster: Cluster.MainnetBeta }));

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ content: [] });
        expect(mocks.getTokenInfos).not.toHaveBeenCalled();
    });

    it('should bound the upstream lookup with an abort signal', async () => {
        const { POST } = await importRoute();
        await POST(createRequest({ addresses: [MINT_A], cluster: Cluster.MainnetBeta }));

        const config = mocks.getTokenInfos.mock.calls[0][3];
        expect(config.signal).toBeInstanceOf(AbortSignal);
    });

    describe('a redacted mint', () => {
        // Both sources run for real, because the route hides a redacted mint only when each of them drops it.
        beforeEach(async () => {
            const actual =
                await vi.importActual<typeof import('@entities/token-info/server')>('@entities/token-info/server');
            mocks.getTokenInfos.mockImplementation(actual.getTokenInfos);
            mocks.getTokenInfosFromMetaplex.mockImplementation(actual.getTokenInfosFromMetaplex);
            vi.stubEnv('JUPITER_API_KEY', 'test-key');
            vi.stubEnv('NEXT_PUBLIC_BAD_TOKENS', MINT_A);
            vi.stubGlobal('fetch', vi.fn());
        });

        afterEach(() => {
            vi.unstubAllEnvs();
            vi.unstubAllGlobals();
        });

        it('should answer an empty list without an RPC read when the caller opts in to the on-chain fallback', async () => {
            const { POST } = await importRoute();
            const res = await POST(
                createRequest({ addresses: [MINT_A], cluster: Cluster.MainnetBeta, includeOnChainFallback: true }),
            );

            expect(res.status).toBe(200);
            expect(await res.json()).toEqual({ content: [] });
            expect(fetch).not.toHaveBeenCalled();
            // The assertion reads the call count, because a failure message that prints the Umi argument throws.
            expect(mocks.safeFetchAllMetadata.mock.calls.length).toBe(0);
        });
    });

    describe('when the Jupiter lookup fails', () => {
        function failUpstream(error: unknown = new Error('upstream exploded')) {
            mocks.getTokenInfos.mockResolvedValue({ error, kind: 'unavailable' });
        }

        it('should answer 503 rather than an empty list', async () => {
            failUpstream();

            const { POST } = await importRoute();
            const res = await POST(createRequest({ addresses: [MINT_A, MINT_B], cluster: Cluster.MainnetBeta }));

            expect(res.status).toBe(503);
            expect(await res.json()).toEqual({ error: 'Token info unavailable' });
            expect(Logger.error).toHaveBeenCalled();
        });

        it('should answer 429 and report the rate limit to Sentry when Jupiter is rate limited', async () => {
            failUpstream(new TokenInfoHttpError({ status: 429, statusText: 'Too Many Requests' }));

            const { POST } = await importRoute();
            const res = await POST(createRequest({ addresses: [MINT_A], cluster: Cluster.MainnetBeta }));

            expect(res.status).toBe(429);
            expect(await res.json()).toEqual({ error: 'Token info rate limited' });
            expect(Logger.error).not.toHaveBeenCalled();
            expect(Logger.warn).toHaveBeenCalledTimes(1);
            expect(Logger.warn).toHaveBeenCalledWith(
                '[api:token-info] Jupiter rate limit exceeded',
                expect.objectContaining({ sentry: true }),
            );
        });

        it.each([
            ['a 500', new TokenInfoHttpError({ status: 500, statusText: 'Internal Server Error' }), 'HTTP 500'],
            ['a timeout', new DOMException('The operation timed out.', 'TimeoutError'), 'timed out'],
        ])('should answer 503 and report %s to Sentry as a warning', async (_, error, upstreamError) => {
            failUpstream(error);

            const { POST } = await importRoute();
            const res = await POST(createRequest({ addresses: [MINT_A], cluster: Cluster.MainnetBeta }));

            expect(res.status).toBe(503);
            expect(Logger.error).not.toHaveBeenCalled();
            expect(Logger.warn).toHaveBeenCalledWith('[api:token-info] Token lookup unavailable', {
                sentry: true,
                sentryExtras: expect.objectContaining({ upstreamError: expect.stringContaining(upstreamError) }),
            });
        });

        it('should answer 503 and report a 401 to Sentry as an error', async () => {
            failUpstream(new TokenInfoHttpError({ status: 401, statusText: 'Unauthorized' }));

            const { POST } = await importRoute();
            const res = await POST(createRequest({ addresses: [MINT_A], cluster: Cluster.MainnetBeta }));

            expect(res.status).toBe(503);
            expect(Logger.error).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ sentry: true }));
        });

        it('should report an invalid Jupiter response to Sentry', async () => {
            failUpstream(new TokenInfoInvalidResponseError());

            const { POST } = await importRoute();
            const res = await POST(createRequest({ addresses: [MINT_A], cluster: Cluster.MainnetBeta }));

            expect(res.status).toBe(503);
            expect(Logger.error).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ sentry: true }));
            expect(Logger.warn).not.toHaveBeenCalled();
        });

        it('should not run the on-chain fallback', async () => {
            failUpstream();

            const { POST } = await importRoute();
            await POST(
                createRequest({
                    addresses: [MINT_A],
                    cluster: Cluster.MainnetBeta,
                    includeOnChainFallback: true,
                }),
            );

            expect(mocks.getTokenInfosFromMetaplex).not.toHaveBeenCalled();
        });
    });

    describe('when Jupiter answers with malformed tokens', () => {
        it('should answer the tokens it did resolve and warn about the rest', async () => {
            mocks.getTokenInfos.mockResolvedValue(resolved([token(MINT_A)], 1));

            const { POST } = await importRoute();
            const res = await POST(createRequest({ addresses: [MINT_A, MINT_B], cluster: Cluster.MainnetBeta }));

            expect(res.status).toBe(200);
            expect(await res.json()).toEqual({ content: [token(MINT_A)] });
            expect(Logger.warn).toHaveBeenCalledWith(
                '[api:token-info] Token lookup dropped malformed tokens',
                expect.objectContaining({ sentry: true }),
            );
        });

        it('should answer 200 without a warning for a mint that is not listed', async () => {
            mocks.getTokenInfos.mockResolvedValue(resolved([]));

            const { POST } = await importRoute();
            const res = await POST(createRequest({ addresses: [MINT_A], cluster: Cluster.MainnetBeta }));

            expect(res.status).toBe(200);
            expect(await res.json()).toEqual({ content: [] });
            expect(Logger.warn).not.toHaveBeenCalled();
        });
    });
});

function resolved(tokens: TokenInfo[], malformed = 0) {
    return { kind: 'resolved', malformed, tokens };
}

function createRequest(body: Record<string, unknown>) {
    return new Request('http://localhost:3000/api/token-info', {
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
    });
}

async function importRoute() {
    return await import('../route');
}

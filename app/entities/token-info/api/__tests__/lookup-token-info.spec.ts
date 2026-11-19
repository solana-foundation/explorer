import { gen } from '@__fixtures__/gen';
import { GENESIS_HASHES, type GenesisHash } from '@entities/chain-id/lib/const';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { maxDuration } from '@/app/api/token-info/route';
import { Logger } from '@/app/shared/lib/logger';

import { tokenInfo } from '../../__fixtures__/token-info';
import { TOKEN_INFO_REQUEST_LIMIT } from '../../lib/request-limit';
import type { TokenInfoLookup } from '../../lib/token-info-lookup';
import type { TokenInfo } from '../../lib/types';
import { JUPITER_ROUTE_TIMEOUT_MS, lookupTokenInfo, lookupVerifiedTokenInfos } from '../lookup-token-info';

// MINT_A sorts before MINT_B.
const MINT_A = gen.address(1);
const MINT_B = gen.address(2);

// One more than the request limit, sorted, so the last mint goes alone in the second chunk.
const MINTS_OVER_LIMIT = Array.from({ length: TOKEN_INFO_REQUEST_LIMIT + 1 }, (_, index) =>
    gen.address(index + 10),
).sort();

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', fetchMock);
    respond(200, { content: [] });
});

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

describe('lookupTokenInfo', () => {
    it('should get one mint without the fallback and return it listed', async () => {
        respond(200, { content: [tokenInfo(MINT_A)] });

        expect(await lookupAll([MINT_A])).toEqual([{ kind: 'listed', token: tokenInfo(MINT_A) }]);
        expect(sentRequests()).toEqual([
            { body: undefined, method: 'GET', url: `/api/token-info/${MINT_A}?cluster=${Cluster.Mainnet}` },
        ]);
    });

    it.each([
        ['add the genesis hash of a Custom cluster', Cluster.Custom, `&genesisHash=${GENESIS_HASHES.MAINNET}`],
        ['leave out the genesis hash of a named cluster', Cluster.Mainnet, ''],
    ])('should %s to the query', async (_, cluster, hashParam) => {
        await lookupAll([MINT_A], { cluster, genesisHash: GENESIS_HASHES.MAINNET });

        expect(sentRequests()[0].url).toBe(`/api/token-info/${MINT_A}?cluster=${cluster}${hashParam}`);
    });

    it.each([
        [
            'the mints queued in one window, sorted',
            [MINT_B, MINT_A],
            {},
            { addresses: [MINT_A, MINT_B], cluster: Cluster.Mainnet, includeOnChainFallback: false },
        ],
        [
            'one mint with the on-chain fallback',
            [MINT_A],
            { includeOnChainFallback: true },
            { addresses: [MINT_A], cluster: Cluster.Mainnet, includeOnChainFallback: true },
        ],
        [
            'the genesis hash of a Custom cluster',
            [MINT_A, MINT_B],
            { cluster: Cluster.Custom, genesisHash: GENESIS_HASHES.MAINNET },
            {
                addresses: [MINT_A, MINT_B],
                cluster: Cluster.Custom,
                genesisHash: GENESIS_HASHES.MAINNET,
                includeOnChainFallback: false,
            },
        ],
    ])('should post %s in one request', async (_, mints, options, body) => {
        await lookupAll(mints, options);

        expect(sentRequests()).toEqual([{ body, method: 'POST', url: '/api/token-info' }]);
    });

    it('should give each caller the lookup of its own mint from one request', async () => {
        respond(200, { content: [tokenInfo(MINT_B)] });

        expect(await lookupAll([MINT_A, MINT_B, MINT_B])).toEqual([
            { kind: 'not-listed' },
            { kind: 'listed', token: tokenInfo(MINT_B) },
            { kind: 'listed', token: tokenInfo(MINT_B) },
        ]);
        expect(fetchMock).toHaveBeenCalledOnce();
    });

    it('should send one request per cluster and per fallback flag', async () => {
        const pending = [
            lookupTokenInfo({ cluster: Cluster.Mainnet, genesisHash: undefined, mint: MINT_A }),
            lookupTokenInfo({ cluster: Cluster.Custom, genesisHash: GENESIS_HASHES.MAINNET, mint: MINT_A }),
            lookupTokenInfo({
                cluster: Cluster.Mainnet,
                genesisHash: undefined,
                includeOnChainFallback: true,
                mint: MINT_A,
            }),
        ];
        await vi.runAllTimersAsync();
        await Promise.all(pending);

        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should split more mints than the request limit into chunks and fail only the mints of a failed chunk', async () => {
        const lastMint = MINTS_OVER_LIMIT[TOKEN_INFO_REQUEST_LIMIT];
        fetchMock.mockImplementation(async (_, init) =>
            init?.method === 'POST'
                ? new Response(null, { status: 503 })
                : Response.json({ content: [tokenInfo(lastMint)] }),
        );

        const lookups = await lookupAll(MINTS_OVER_LIMIT);

        expect(lookups.slice(0, -1)).toEqual(Array(TOKEN_INFO_REQUEST_LIMIT).fill({ kind: 'unavailable' }));
        expect(lookups.at(-1)).toEqual({ kind: 'listed', token: tokenInfo(lastMint) });
    });

    it('should give a request with the on-chain fallback a timeout above the route maxDuration', async () => {
        const timeout = vi.spyOn(AbortSignal, 'timeout');

        await lookupAll([MINT_A], { includeOnChainFallback: true });

        expect(timeout.mock.calls[0][0]).toBeGreaterThan(maxDuration * 1000);
    });

    it.each([
        ['a mint that is not an address', ['not-a-mint'], {}],
        ['a Custom cluster with no genesis hash', [MINT_A], { cluster: Cluster.Custom }],
        ['devnet without the fallback', [MINT_A], { cluster: Cluster.Devnet }],
    ])('should return not-listed without a request for %s', async (_, mints, options) => {
        expect(await lookupAll(mints, options)).toEqual([{ kind: 'not-listed' }]);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should look up a devnet mint with the on-chain fallback', async () => {
        respond(200, { content: [tokenInfo(MINT_A)] });

        const lookups = await lookupAll([MINT_A], { cluster: Cluster.Devnet, includeOnChainFallback: true });

        expect(lookups).toEqual([{ kind: 'listed', token: tokenInfo(MINT_A) }]);
    });

    it.each([
        ['rate-limited', 'a 429', () => respond(429, {})],
        ['unavailable', 'a 503', () => respond(503, {})],
        ['unavailable', 'a body without a content array', () => respond(200, {})],
        ['unavailable', 'a network error', () => fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))],
        [
            'unavailable',
            'a browser without AbortSignal.timeout',
            () =>
                vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => {
                    throw new TypeError('not a function');
                }),
        ],
    ])('should return %s for %s', async (kind, _, arrange) => {
        arrange();

        expect(await lookupAll([MINT_A])).toEqual([{ kind }]);
    });

    it('should drop a malformed entry, return the other entries and report the count once', async () => {
        respond(200, { content: [withoutField(MINT_A, 'verified'), tokenInfo(MINT_B)] });

        expect(await lookupAll([MINT_A, MINT_B])).toEqual([
            { kind: 'not-listed' },
            { kind: 'listed', token: tokenInfo(MINT_B) },
        ]);
        expect(Logger.warn).toHaveBeenCalledOnce();
        expect(Logger.warn).toHaveBeenCalledWith(expect.any(String), {
            sentry: 'always',
            sentryExtras: { addressCount: 2, cluster: Cluster.Mainnet, malformed: 1, total: 2 },
        });
    });
});

describe('lookupVerifiedTokenInfos', () => {
    it('should post the mints to the verified route with the Jupiter route timeout and return the tokens', async () => {
        const timeout = vi.spyOn(AbortSignal, 'timeout');
        respond(200, { content: [tokenInfo(MINT_A, true)] });

        const lookup = await lookupVerifiedTokenInfos({ addresses: [MINT_A, MINT_B] });

        expect(lookup).toEqual({ kind: 'resolved', tokens: [tokenInfo(MINT_A, true)] });
        expect(sentRequests()).toEqual([
            { body: { addresses: [MINT_A, MINT_B] }, method: 'POST', url: '/api/token-info/verified' },
        ]);
        expect(timeout).toHaveBeenCalledWith(JUPITER_ROUTE_TIMEOUT_MS);
    });
});

async function lookupAll(
    mints: string[],
    {
        cluster = Cluster.Mainnet,
        genesisHash,
        includeOnChainFallback,
    }: { cluster?: Cluster; genesisHash?: GenesisHash; includeOnChainFallback?: boolean } = {},
): Promise<TokenInfoLookup[]> {
    const pending = Promise.all(
        mints.map(mint => lookupTokenInfo({ cluster, genesisHash, includeOnChainFallback, mint })),
    );
    await vi.runAllTimersAsync();
    return pending;
}

function respond(status: number, body: unknown): void {
    fetchMock.mockImplementation(async () => Response.json(body, { status }));
}

function sentRequests(): { body: unknown; method: string | undefined; url: string }[] {
    return fetchMock.mock.calls.map(([url, init]) => ({
        body: init?.body === undefined ? undefined : JSON.parse(String(init.body)),
        method: init?.method,
        url: String(url),
    }));
}

function withoutField(address: string, field: keyof TokenInfo): Record<string, unknown> {
    return Object.fromEntries(Object.entries(tokenInfo(address)).filter(([key]) => key !== field));
}

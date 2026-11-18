import { gen } from '@__fixtures__/gen';
import { GENESIS_HASHES } from '@entities/chain-id/lib/const';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { maxDuration } from '@/app/api/token-info/route';
import { Logger } from '@/app/shared/lib/logger';

import { tokenInfo } from '../../__fixtures__/token-info';
import { TOKEN_INFO_REQUEST_LIMIT } from '../../lib/request-limit';
import type { TokenInfoLookup } from '../../lib/token-info-lookup';
import { type TokenInfo } from '../../lib/types';
import { lookupTokenInfo } from '../lookup-token-info';

const MINT_A = gen.address(1);
const MINT_B = gen.address(2);

describe('lookupTokenInfo', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('should post one mint and return listed', async () => {
        respond(200, { content: [tokenInfo(MINT_A, true)] });

        const [lookup] = await lookupAll([MINT_A]);

        expect(lookup).toEqual({ kind: 'listed', token: tokenInfo(MINT_A, true) });
        expect(sentRequests()).toEqual([
            {
                body: { addresses: [MINT_A], cluster: Cluster.Mainnet, includeOnChainFallback: false },
                method: 'POST',
                url: '/api/token-info',
            },
        ]);
    });

    it('should post the mints queued in one window in one sorted request', async () => {
        respond(200, { content: [tokenInfo(MINT_A), tokenInfo(MINT_B)] });
        const [first, last] = [MINT_A, MINT_B].sort();

        const lookups = await lookupAll([last, first]);

        expect(lookups).toEqual([
            { kind: 'listed', token: tokenInfo(last) },
            { kind: 'listed', token: tokenInfo(first) },
        ]);
        expect(sentRequests()).toEqual([
            {
                body: { addresses: [first, last], cluster: Cluster.Mainnet, includeOnChainFallback: false },
                method: 'POST',
                url: '/api/token-info',
            },
        ]);
    });

    it('should request a mint queued twice in one window once', async () => {
        respond(200, { content: [tokenInfo(MINT_A)] });

        const lookups = await lookupAll([MINT_A, MINT_A]);

        expect(lookups).toEqual([
            { kind: 'listed', token: tokenInfo(MINT_A) },
            { kind: 'listed', token: tokenInfo(MINT_A) },
        ]);
        expect(sentRequests()).toHaveLength(1);
        expect(sentRequests()[0].body).toMatchObject({ addresses: [MINT_A] });
    });

    it('should send a separate request per cluster and per fallback flag', async () => {
        respond(200, { content: [] });

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

        expect(sentRequests().map(({ body }) => body)).toEqual(
            expect.arrayContaining([
                { addresses: [MINT_A], cluster: Cluster.Mainnet, includeOnChainFallback: false },
                {
                    addresses: [MINT_A],
                    cluster: Cluster.Custom,
                    genesisHash: GENESIS_HASHES.MAINNET,
                    includeOnChainFallback: false,
                },
                { addresses: [MINT_A], cluster: Cluster.Mainnet, includeOnChainFallback: true },
            ]),
        );
        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should post one mint with the on-chain fallback', async () => {
        respond(200, { content: [] });

        await lookupAll([MINT_A], { includeOnChainFallback: true });

        expect(sentRequests()).toEqual([
            {
                body: { addresses: [MINT_A], cluster: Cluster.Mainnet, includeOnChainFallback: true },
                method: 'POST',
                url: '/api/token-info',
            },
        ]);
    });

    it('should send the genesis hash of a Custom cluster in the body', async () => {
        respond(200, { content: [] });

        await lookupAll([MINT_A, MINT_B], { cluster: Cluster.Custom, genesisHash: GENESIS_HASHES.MAINNET });

        expect(sentRequests()[0].body).toEqual({
            addresses: [MINT_A, MINT_B].sort(),
            cluster: Cluster.Custom,
            genesisHash: GENESIS_HASHES.MAINNET,
            includeOnChainFallback: false,
        });
    });

    it('should split more mints than the request limit into chunks', async () => {
        const mints = Array.from({ length: TOKEN_INFO_REQUEST_LIMIT + 1 }, (_, index) => gen.address(index + 10));
        stubRouteListing(mints);

        const lookups = await lookupAll(mints);

        expect(sentRequests()).toHaveLength(2);
        expect(lookups.every(lookup => lookup.kind === 'listed')).toBe(true);
    });

    it('should fail only the mints of a failed chunk', async () => {
        const mints = Array.from({ length: TOKEN_INFO_REQUEST_LIMIT + 1 }, (_, index) => gen.address(index + 10));
        const [lastMint] = [...mints].sort().slice(-1);
        vi.mocked(fetch).mockImplementation(async (_, init) =>
            JSON.parse(String(init?.body)).addresses.length === 1
                ? Response.json({ content: [tokenInfo(lastMint)] })
                : new Response(null, { status: 503 }),
        );

        const lookups = await lookupAll(mints);

        expect(lookups[mints.indexOf(lastMint)]).toEqual({ kind: 'listed', token: tokenInfo(lastMint) });
        expect(lookups.filter(lookup => lookup.kind === 'unavailable')).toHaveLength(TOKEN_INFO_REQUEST_LIMIT);
    });

    it('should give each chunk its own timeout', async () => {
        const timeout = vi.spyOn(AbortSignal, 'timeout');
        const mints = Array.from({ length: TOKEN_INFO_REQUEST_LIMIT + 1 }, (_, index) => gen.address(index + 10));
        respond(200, { content: [] });

        await lookupAll(mints);

        const signals = vi.mocked(fetch).mock.calls.map(([, init]) => init?.signal);
        expect(timeout).toHaveBeenCalledTimes(2);
        expect(signals[0]).toBeInstanceOf(AbortSignal);
        expect(signals[0]).not.toBe(signals[1]);
        timeout.mockRestore();
    });

    it('should give a chunk with the on-chain fallback a timeout above the route maxDuration', async () => {
        const timeout = vi.spyOn(AbortSignal, 'timeout');
        respond(200, { content: [] });

        await lookupAll([MINT_A], { includeOnChainFallback: true });

        expect(timeout.mock.calls[0][0]).toBeGreaterThan(maxDuration * 1000);
        timeout.mockRestore();
    });

    it('should return not-listed without a request for a mint that is not an address', async () => {
        await expect(lookupAll(['not-a-mint'])).resolves.toEqual([{ kind: 'not-listed' }]);
        expect(fetch).not.toHaveBeenCalled();
    });

    it('should return not-listed without a request on a Custom cluster with no genesis hash', async () => {
        await expect(lookupAll([MINT_A], { cluster: Cluster.Custom })).resolves.toEqual([{ kind: 'not-listed' }]);
        expect(fetch).not.toHaveBeenCalled();
    });

    it('should return not-listed without a request on devnet without the fallback', async () => {
        await expect(lookupAll([MINT_A], { cluster: Cluster.Devnet })).resolves.toEqual([{ kind: 'not-listed' }]);
        expect(fetch).not.toHaveBeenCalled();
    });

    it('should request devnet tokens with the on-chain fallback', async () => {
        respond(200, { content: [tokenInfo(MINT_A)] });

        const lookups = await lookupAll([MINT_A], { cluster: Cluster.Devnet, includeOnChainFallback: true });

        expect(lookups).toEqual([{ kind: 'listed', token: tokenInfo(MINT_A) }]);
    });

    it('should return rate-limited for a 429 response', async () => {
        respond(429, { error: 'Token info rate limited' });

        await expect(lookupAll([MINT_A])).resolves.toEqual([{ kind: 'rate-limited' }]);
    });

    it('should return unavailable for a 503 response', async () => {
        respond(503, { error: 'Token info unavailable' });

        await expect(lookupAll([MINT_A])).resolves.toEqual([{ kind: 'unavailable' }]);
    });

    it('should warn and return unavailable for a 200 body without a content array', async () => {
        respond(200, {});

        await expect(lookupAll([MINT_A])).resolves.toEqual([{ kind: 'unavailable' }]);
        expect(Logger.warn).toHaveBeenCalledWith(
            '[token-info] Token info response was not a token array',
            expect.anything(),
        );
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should drop a malformed entry, return the other entries and log the count', async () => {
        respond(200, { content: [withoutField('verified'), tokenInfo(MINT_B, true)] });

        const lookups = await lookupAll([MINT_A, MINT_B]);

        expect(lookups).toEqual([{ kind: 'not-listed' }, { kind: 'listed', token: tokenInfo(MINT_B, true) }]);
        expect(Logger.warn).toHaveBeenCalledWith('[token-info] Dropped malformed token info entries', {
            sentry: 'always',
            sentryExtras: { addressCount: 2, cluster: Cluster.Mainnet, malformed: 1, total: 2 },
        });
    });

    it('should log the count once when every entry is malformed', async () => {
        respond(200, { content: [withoutField('verified'), withoutField('address')] });

        await expect(lookupAll([MINT_A, MINT_B])).resolves.toEqual([{ kind: 'not-listed' }, { kind: 'not-listed' }]);
        expect(Logger.warn).toHaveBeenCalledTimes(1);
        expect(Logger.warn).toHaveBeenCalledWith('[token-info] Dropped malformed token info entries', {
            sentry: 'always',
            sentryExtras: { addressCount: 2, cluster: Cluster.Mainnet, malformed: 2, total: 2 },
        });
    });

    it('should return unavailable when the request fails', async () => {
        vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));

        await expect(lookupAll([MINT_A])).resolves.toEqual([{ kind: 'unavailable' }]);
    });

    it('should return unavailable when the timeout signal cannot be created', async () => {
        const timeout = vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => {
            throw new TypeError('AbortSignal.timeout is not a function');
        });

        await expect(lookupAll([MINT_A])).resolves.toEqual([{ kind: 'unavailable' }]);
        timeout.mockRestore();
    });
});

async function lookupAll(
    mints: string[],
    {
        cluster = Cluster.Mainnet,
        genesisHash,
        includeOnChainFallback,
    }: { cluster?: Cluster; genesisHash?: string; includeOnChainFallback?: boolean } = {},
): Promise<TokenInfoLookup[]> {
    const pending = Promise.all(
        mints.map(mint => lookupTokenInfo({ cluster, genesisHash, includeOnChainFallback, mint })),
    );
    await vi.runAllTimersAsync();
    return pending;
}

function respond(status: number, body: unknown): void {
    vi.mocked(fetch).mockImplementation(async () => Response.json(body, { status }));
}

function stubRouteListing(mints: string[]): void {
    vi.mocked(fetch).mockImplementation(async () => Response.json({ content: mints.map(mint => tokenInfo(mint)) }));
}

function withoutField(field: keyof TokenInfo): Record<string, unknown> {
    return Object.fromEntries(Object.entries(tokenInfo(MINT_A)).filter(([key]) => key !== field));
}

function sentRequests(): { body: unknown; method: string | undefined; url: string }[] {
    return vi.mocked(fetch).mock.calls.map(([url, init]) => ({
        body: init?.body === undefined ? undefined : JSON.parse(String(init.body)),
        method: init?.method,
        url: String(url),
    }));
}

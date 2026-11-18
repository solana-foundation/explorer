import { GENESIS_HASHES } from '@entities/chain-id';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gen } from '@/app/__fixtures__/gen';
import { maxDuration } from '@/app/api/token-info/route';
import { maxDuration as verifiedMaxDuration } from '@/app/api/token-info/verified/route';
import { Logger } from '@/app/shared/lib/logger';

import { jupiterToken } from '../../__fixtures__/jupiter-token';
import { redactedTokenInfo, tokenInfo } from '../../__fixtures__/token-info';
import { JupiterHttpError } from '../../lib/errors';
import type { JupiterToken } from '../../lib/jupiter-token';
import type { TokenInfo } from '../../lib/types';
import { JUPITER_ROUTE_TIMEOUT_MS } from '../lookup-token-info';
import { lookupTokenInfo, lookupTokenInfos, lookupVerifiedTokenInfos } from '../lookup-token-info.server';

const MINT_A = gen.address(1);
const MINT_B = gen.address(2);
const MINT_C = gen.address(3);
const MAINNET_RPC_URL = 'https://mainnet.rpc.test';

const mocks = vi.hoisted(() => ({
    dataCache: new Map<string, unknown>(),
    fetchJupiterVerifiedTokens: vi.fn(),
    getTokenInfosFromMetaplex: vi.fn(),
    isDataCacheStale: false,
    searchJupiterTokens: vi.fn(),
    unstableCacheOptions: undefined as unknown,
}));

// Like the Next data cache, the fake keeps whatever the function returns and nothing when it throws.
vi.mock('next/cache', () => ({
    unstable_cache: (fn: () => Promise<unknown>, keyParts: string[], options: unknown) => {
        mocks.unstableCacheOptions = options;
        return async () => {
            const key = keyParts.join(',');
            if (mocks.dataCache.has(key) && !mocks.isDataCacheStale) return mocks.dataCache.get(key);
            try {
                mocks.dataCache.set(key, await fn());
            } catch (error) {
                if (!mocks.dataCache.has(key)) throw error;
            }
            return mocks.dataCache.get(key);
        };
    },
}));

vi.mock('../fetch-token-metaplex', () => ({ getTokenInfosFromMetaplex: mocks.getTokenInfosFromMetaplex }));
vi.mock('../fetch-jupiter-tokens', () => ({
    fetchJupiterVerifiedTokens: mocks.fetchJupiterVerifiedTokens,
    searchJupiterTokens: mocks.searchJupiterTokens,
}));

beforeEach(() => {
    vi.stubEnv('JUPITER_API_KEY', 'test-key');
    vi.stubEnv('MAINNET_RPC_URL', MAINNET_RPC_URL);
    mocks.searchJupiterTokens.mockResolvedValue({ kind: 'resolved', tokens: [] });
    mocks.getTokenInfosFromMetaplex.mockResolvedValue([]);
    vi.spyOn(Logger, 'warn').mockImplementation(() => {});
    vi.spyOn(Logger, 'error').mockImplementation(() => {});
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    mocks.searchJupiterTokens.mockReset();
    mocks.fetchJupiterVerifiedTokens.mockReset();
    mocks.getTokenInfosFromMetaplex.mockReset();
    mocks.dataCache.clear();
    mocks.isDataCacheStale = false;
});

describe('lookupTokenInfos', () => {
    it('should search Jupiter for the mints with the API key', async () => {
        await lookupTokenInfos({ addresses: [MINT_A, MINT_B], cluster: Cluster.Mainnet, genesisHash: undefined });

        expect(mocks.searchJupiterTokens).toHaveBeenCalledWith(
            expect.objectContaining({ apiKey: 'test-key', query: `${MINT_A},${MINT_B}` }),
        );
    });

    it('should keep each response in the Next data cache', async () => {
        await lookupTokenInfos({ addresses: [MINT_A], cluster: Cluster.Mainnet, genesisHash: undefined });

        const [search] = mocks.searchJupiterTokens.mock.calls[0];
        expect(search.revalidate).toBeGreaterThan(0);
    });

    it('should time out the Jupiter requests below the route maxDuration and the browser timeout', async () => {
        const timeout = vi.spyOn(AbortSignal, 'timeout');

        await lookupTokenInfos({ addresses: [MINT_A], cluster: Cluster.Mainnet, genesisHash: undefined });

        const [search] = mocks.searchJupiterTokens.mock.calls[0];
        expect(search.signal).toBe(timeout.mock.results[0].value);
        expect(timeout.mock.calls[0][0]).toBeLessThanOrEqual((maxDuration * 1000) / 2);
        expect(timeout.mock.calls[0][0]).toBeLessThan(JUPITER_ROUTE_TIMEOUT_MS);
    });

    it('should return nothing listed without a request on devnet', async () => {
        expect(
            await lookupTokenInfos({ addresses: [MINT_A], cluster: Cluster.Devnet, genesisHash: undefined }),
        ).toEqual(resolved([]));
        expect(mocks.searchJupiterTokens).not.toHaveBeenCalled();
    });

    it('should resolve no tokens without a request on a Custom cluster with no genesis hash', async () => {
        expect(
            await lookupTokenInfos({ addresses: [MINT_A], cluster: Cluster.Custom, genesisHash: undefined }),
        ).toEqual(resolved([]));
        expect(mocks.searchJupiterTokens).not.toHaveBeenCalled();
    });

    it('should search Jupiter for a custom cluster with the mainnet genesis hash', async () => {
        respond([jupiterToken(MINT_A)]);

        const result = await lookupTokenInfos({
            addresses: [MINT_A],
            cluster: Cluster.Custom,
            genesisHash: GENESIS_HASHES.MAINNET,
        });

        expect(result).toEqual(resolved([tokenInfo(MINT_A)]));
    });

    it('should return unavailable and report an error without a request when JUPITER_API_KEY is not set', async () => {
        vi.stubEnv('JUPITER_API_KEY', '');

        const result = await lookupTokenInfos({
            addresses: [MINT_A],
            cluster: Cluster.Mainnet,
            genesisHash: undefined,
        });

        expect(result).toEqual({ kind: 'unavailable' });
        expect(mocks.searchJupiterTokens).not.toHaveBeenCalled();
        expect(Logger.error).toHaveBeenCalledWith(
            expect.objectContaining({ message: '[api:token-info] Token lookup unavailable' }),
            expect.objectContaining({ sentry: true }),
        );
    });

    it('should map a Jupiter token to token info', async () => {
        respond([
            {
                decimals: 9,
                icon: 'https://example.com/a.png',
                id: MINT_A,
                isVerified: true,
                name: 'Token A',
                symbol: 'TKA',
            },
        ]);

        expect(
            await lookupTokenInfos({ addresses: [MINT_A], cluster: Cluster.Mainnet, genesisHash: undefined }),
        ).toEqual(
            resolved([
                {
                    address: MINT_A,
                    decimals: 9,
                    logoURI: 'https://example.com/a.png',
                    name: 'Token A',
                    symbol: 'TKA',
                    verified: true,
                },
            ]),
        );
    });

    it('should keep the verified flag of a redacted mint and drop its name, symbol and logo', async () => {
        vi.stubEnv('NEXT_PUBLIC_BAD_TOKENS', MINT_A);
        respond([jupiterToken(MINT_A, { icon: 'https://example.com/a.png', isVerified: true }), jupiterToken(MINT_B)]);

        const result = await lookupTokenInfos({
            addresses: [MINT_A, MINT_B],
            cluster: Cluster.Mainnet,
            genesisHash: undefined,
        });

        expect(result).toEqual(resolved([redactedTokenInfo(MINT_A, true), tokenInfo(MINT_B)]));
    });

    it('should keep the verified flag of a mint with an empty name and symbol', async () => {
        respond([jupiterToken(MINT_A, { isVerified: true, name: '', symbol: '' })]);

        const result = await lookupTokenInfos({
            addresses: [MINT_A],
            cluster: Cluster.Mainnet,
            genesisHash: undefined,
        });

        expect(result).toEqual(resolved([{ ...tokenInfo(MINT_A, true), name: undefined, symbol: undefined }]));
    });

    it('should drop a token for a mint that was not requested', async () => {
        respond([jupiterToken(MINT_A), jupiterToken(MINT_B)]);

        const result = await lookupTokenInfos({
            addresses: [MINT_A],
            cluster: Cluster.Mainnet,
            genesisHash: undefined,
        });

        expect(result).toEqual(resolved([tokenInfo(MINT_A)]));
    });

    it('should return rate-limited and warn when Jupiter rate limits the request', async () => {
        mocks.searchJupiterTokens.mockResolvedValueOnce({ kind: 'rate-limited' });

        const result = await lookupTokenInfos({
            addresses: [MINT_A],
            cluster: Cluster.Mainnet,
            genesisHash: undefined,
        });

        expect(result).toEqual({ kind: 'rate-limited' });
        expect(Logger.warn).toHaveBeenCalledWith(
            '[api:token-info] Jupiter rate limit exceeded',
            expect.objectContaining({ sentry: true }),
        );
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should return unavailable and warn when Jupiter times out', async () => {
        mocks.searchJupiterTokens.mockResolvedValueOnce({
            error: new DOMException('The operation timed out.', 'TimeoutError'),
            kind: 'unavailable',
        });

        const result = await lookupTokenInfos({
            addresses: [MINT_A],
            cluster: Cluster.Mainnet,
            genesisHash: undefined,
        });

        expect(result).toEqual({ kind: 'unavailable' });
        expect(Logger.warn).toHaveBeenCalledWith('[api:token-info] Token lookup unavailable', {
            sentry: true,
            sentryExtras: expect.objectContaining({ upstreamError: expect.stringContaining('timed out') }),
        });
        expect(Logger.error).not.toHaveBeenCalled();
    });
});

describe('lookupTokenInfos with the on-chain fallback', () => {
    it('should add the on-chain token info of the mints Jupiter does not list', async () => {
        respond([jupiterToken(MINT_A)]);
        mocks.getTokenInfosFromMetaplex.mockResolvedValue([tokenInfo(MINT_C)]);

        const result = await lookupTokenInfos({
            addresses: [MINT_A, MINT_B, MINT_C],
            cluster: Cluster.Mainnet,
            genesisHash: undefined,
            includeOnChainFallback: true,
        });

        expect(mocks.getTokenInfosFromMetaplex).toHaveBeenCalledWith([MINT_B, MINT_C], MAINNET_RPC_URL, {
            onError: expect.any(Function),
        });
        expect(result).toEqual(resolved([tokenInfo(MINT_A), tokenInfo(MINT_C)]));
    });

    it('should read on-chain metadata without a Jupiter request on devnet', async () => {
        mocks.getTokenInfosFromMetaplex.mockResolvedValue([tokenInfo(MINT_A)]);

        const result = await lookupTokenInfos({
            addresses: [MINT_A],
            cluster: Cluster.Devnet,
            genesisHash: undefined,
            includeOnChainFallback: true,
        });

        expect(result).toEqual(resolved([tokenInfo(MINT_A)]));
        expect(mocks.searchJupiterTokens).not.toHaveBeenCalled();
    });

    it('should not read on-chain metadata without the option', async () => {
        await lookupTokenInfos({ addresses: [MINT_A], cluster: Cluster.Mainnet, genesisHash: undefined });

        expect(mocks.getTokenInfosFromMetaplex).not.toHaveBeenCalled();
    });

    it('should not read on-chain metadata when Jupiter lists every mint', async () => {
        respond([jupiterToken(MINT_A)]);

        await lookupTokenInfos({
            addresses: [MINT_A],
            cluster: Cluster.Mainnet,
            genesisHash: undefined,
            includeOnChainFallback: true,
        });

        expect(mocks.getTokenInfosFromMetaplex).not.toHaveBeenCalled();
    });

    it('should not read on-chain metadata on a custom cluster', async () => {
        const result = await lookupTokenInfos({
            addresses: [MINT_A],
            cluster: Cluster.Custom,
            genesisHash: GENESIS_HASHES.MAINNET,
            includeOnChainFallback: true,
        });

        expect(result).toEqual(resolved([]));
        expect(mocks.getTokenInfosFromMetaplex).not.toHaveBeenCalled();
    });

    it('should return the Jupiter tokens and warn when the on-chain read throws', async () => {
        respond([jupiterToken(MINT_A)]);
        mocks.getTokenInfosFromMetaplex.mockRejectedValue(new Error('rpc failed'));

        const result = await lookupTokenInfos({
            addresses: [MINT_A, MINT_B],
            cluster: Cluster.Mainnet,
            genesisHash: undefined,
            includeOnChainFallback: true,
        });

        expect(result).toEqual(resolved([tokenInfo(MINT_A)]));
        expect(Logger.warn).toHaveBeenCalledWith('[api:token-info] Metaplex fallback failed', {
            error: expect.any(Error),
        });
    });

    it('should return a Jupiter failure without an on-chain read', async () => {
        mocks.searchJupiterTokens.mockResolvedValueOnce({
            error: new JupiterHttpError({ status: 503, statusText: 'Service Unavailable' }),
            kind: 'unavailable',
        });

        const result = await lookupTokenInfos({
            addresses: [MINT_A],
            cluster: Cluster.Mainnet,
            genesisHash: undefined,
            includeOnChainFallback: true,
        });

        expect(result).toEqual({ kind: 'unavailable' });
        expect(mocks.getTokenInfosFromMetaplex).not.toHaveBeenCalled();
    });
});

describe('lookupTokenInfo', () => {
    it('should return the lookup of the mint', async () => {
        respond([jupiterToken(MINT_A)]);

        expect(await lookupTokenInfo({ cluster: Cluster.Mainnet, genesisHash: undefined, mint: MINT_A })).toEqual({
            kind: 'listed',
            token: tokenInfo(MINT_A),
        });
    });

    it('should return not-listed without a request for a mint that is not an address', async () => {
        expect(await lookupTokenInfo({ cluster: Cluster.Mainnet, genesisHash: undefined, mint: 'bonk' })).toEqual({
            kind: 'not-listed',
        });
        expect(mocks.searchJupiterTokens).not.toHaveBeenCalled();
    });
});

describe('lookupVerifiedTokenInfos', () => {
    it('should return the token info of the verified tokens among the addresses', async () => {
        respondVerified([jupiterToken(MINT_A, { isVerified: true }), jupiterToken(MINT_B, { isVerified: true })]);

        expect(await lookupVerifiedTokenInfos({ addresses: [MINT_A, MINT_C] })).toEqual(
            resolved([tokenInfo(MINT_A, true)]),
        );
    });

    it('should keep the verified list in the Next data cache, so the next lookup sends no Jupiter request', async () => {
        respondVerified([jupiterToken(MINT_A, { isVerified: true })]);

        await lookupVerifiedTokenInfos({ addresses: [MINT_A] });
        await lookupVerifiedTokenInfos({ addresses: [MINT_B] });

        expect(mocks.fetchJupiterVerifiedTokens).toHaveBeenCalledTimes(1);
        expect(mocks.unstableCacheOptions).toEqual({ revalidate: expect.any(Number) });
    });

    it('should time out the Jupiter request below the route maxDuration and the browser timeout', async () => {
        const timeout = vi.spyOn(AbortSignal, 'timeout');
        respondVerified([]);

        await lookupVerifiedTokenInfos({ addresses: [MINT_A] });

        expect(mocks.fetchJupiterVerifiedTokens).toHaveBeenCalledWith({
            apiKey: 'test-key',
            signal: timeout.mock.results[0].value,
        });
        expect(timeout.mock.calls[0][0]).toBeLessThanOrEqual((verifiedMaxDuration * 1000) / 2);
        expect(timeout.mock.calls[0][0]).toBeLessThan(JUPITER_ROUTE_TIMEOUT_MS);
    });

    it.each([
        ['rate-limited', { kind: 'rate-limited' }],
        [
            'unavailable',
            { error: new JupiterHttpError({ status: 401, statusText: 'Unauthorized' }), kind: 'unavailable' },
        ],
    ])('should return %s, report it, and ask Jupiter again on the next lookup', async (kind, failure) => {
        mocks.fetchJupiterVerifiedTokens.mockResolvedValueOnce(failure);
        respondVerified([jupiterToken(MINT_A, { isVerified: true })]);

        expect(await lookupVerifiedTokenInfos({ addresses: [MINT_A] })).toEqual({ kind });
        expect([...vi.mocked(Logger.warn).mock.calls, ...vi.mocked(Logger.error).mock.calls]).toEqual([
            [expect.anything(), expect.objectContaining({ sentry: true, sentryExtras: { tag: 'verified' } })],
        ]);
        expect(await lookupVerifiedTokenInfos({ addresses: [MINT_A] })).toEqual(resolved([tokenInfo(MINT_A, true)]));
    });

    it('should return the stale list and report a failed refresh of it', async () => {
        respondVerified([jupiterToken(MINT_A, { isVerified: true })]);
        await lookupVerifiedTokenInfos({ addresses: [MINT_A] });
        mocks.isDataCacheStale = true;
        mocks.fetchJupiterVerifiedTokens.mockResolvedValueOnce({ kind: 'rate-limited' });

        expect(await lookupVerifiedTokenInfos({ addresses: [MINT_A] })).toEqual(resolved([tokenInfo(MINT_A, true)]));
        expect(Logger.warn).toHaveBeenCalledWith('[api:token-info] Jupiter rate limit exceeded', {
            sentry: true,
            sentryExtras: { tag: 'verified' },
        });
    });

    it('should return unavailable and report an error without a request when JUPITER_API_KEY is not set', async () => {
        vi.stubEnv('JUPITER_API_KEY', '');

        expect(await lookupVerifiedTokenInfos({ addresses: [MINT_A] })).toEqual({ kind: 'unavailable' });
        expect(mocks.fetchJupiterVerifiedTokens).not.toHaveBeenCalled();
        expect(Logger.error).toHaveBeenCalledWith(
            expect.objectContaining({ message: '[api:token-info] Token lookup unavailable' }),
            expect.objectContaining({ sentry: true }),
        );
    });
});

function respondVerified(tokens: JupiterToken[]) {
    mocks.fetchJupiterVerifiedTokens.mockResolvedValue({ kind: 'resolved', tokens });
}

function respond(tokens: JupiterToken[]) {
    mocks.searchJupiterTokens.mockResolvedValueOnce({ kind: 'resolved', tokens });
}

function resolved(tokens: TokenInfo[]) {
    return { kind: 'resolved', tokens };
}

import { GENESIS_HASHES } from '@entities/chain-id';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gen } from '@/app/__fixtures__/gen';
import { maxDuration } from '@/app/api/token-info/route';
import { maxDuration as verifiedMaxDuration } from '@/app/api/token-info/verified/route';
import { Logger } from '@/app/shared/lib/logger';

import { jupiterToken } from '../../__fixtures__/jupiter-token';
import { redactedTokenInfo, resolved, tokenInfo } from '../../__fixtures__/token-info';
import type { TokenInfosLookup } from '../../lib/token-info-lookup';
import type { TokenInfo } from '../../lib/types';
import { getTokenInfosFromMetaplex } from '../fetch-token-metaplex';
import { JUPITER_ROUTE_TIMEOUT_MS } from '../lookup-token-info';
import { lookupTokenInfo, lookupTokenInfos, lookupVerifiedTokenInfos } from '../lookup-token-info.server';

const MINT_A = gen.address(1);
const MINT_B = gen.address(2);
const MINT_C = gen.address(3);

const dataCache = vi.hoisted(() => new Map<string, unknown>());

// Like the Next data cache, the fake keeps what the function returns, and nothing when it throws.
vi.mock('next/cache', () => ({
    unstable_cache: (fn: () => Promise<unknown>, keyParts: string[]) => async () => {
        const key = keyParts.join(',');
        if (!dataCache.has(key)) dataCache.set(key, await fn());
        return dataCache.get(key);
    },
}));
vi.mock('../fetch-token-metaplex', () => ({ getTokenInfosFromMetaplex: vi.fn() }));

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('JUPITER_API_KEY', 'test-key');
    jupiterAnswers([]);
    vi.mocked(getTokenInfosFromMetaplex).mockImplementation(async addresses => addresses.map(onChainTokenInfo));
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    dataCache.clear();
});

describe('lookupTokenInfos', () => {
    it('should search Jupiter for the mints with the API key and a revalidate period', async () => {
        await lookup([MINT_A, MINT_B]);

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(`https://api.jup.ag/tokens/v2/search?query=${MINT_A}%2C${MINT_B}`);
        expect(init).toMatchObject({ headers: { 'x-api-key': 'test-key' }, next: { revalidate: expect.any(Number) } });
    });

    it.each([
        ['devnet', Cluster.Devnet, undefined],
        ['a Custom cluster with no genesis hash', Cluster.Custom, undefined],
    ])('should resolve no tokens without a request on %s', async (_, cluster, genesisHash) => {
        expect(await lookup([MINT_A], { cluster, genesisHash })).toEqual(resolved());
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should search Jupiter on a Custom cluster with the mainnet genesis hash', async () => {
        jupiterAnswers([jupiterToken(MINT_A)]);

        const result = await lookup([MINT_A], { cluster: Cluster.Custom, genesisHash: GENESIS_HASHES.MAINNET });

        expect(result).toEqual(resolved(tokenInfo(MINT_A)));
    });

    it('should map a Jupiter token to token info', async () => {
        const icon = 'https://a.test/a.png';
        const website = 'https://a.test';
        jupiterAnswers([
            jupiterToken(MINT_A, { decimals: 9, icon, isVerified: true, name: 'A', symbol: 'A', website }),
        ]);

        const result = await lookup([MINT_A]);

        expect(result).toEqual(
            resolved({ ...tokenInfo(MINT_A, true), decimals: 9, logoURI: icon, name: 'A', symbol: 'A', website }),
        );
    });

    it('should drop the website of an unverified mint', async () => {
        jupiterAnswers([jupiterToken(MINT_A, { website: 'https://a.test' })]);

        expect(await lookup([MINT_A])).toEqual(resolved(tokenInfo(MINT_A)));
    });

    it('should keep the verified flag of a mint with an empty name and symbol', async () => {
        jupiterAnswers([jupiterToken(MINT_A, { isVerified: true, name: '', symbol: '' })]);

        expect(await lookup([MINT_A])).toEqual(
            resolved({ ...tokenInfo(MINT_A, true), name: undefined, symbol: undefined }),
        );
    });

    it('should redact a mint in NEXT_PUBLIC_BAD_TOKENS', async () => {
        vi.stubEnv('NEXT_PUBLIC_BAD_TOKENS', MINT_A);
        jupiterAnswers([
            jupiterToken(MINT_A, { icon: 'https://a.test/a.png', isVerified: true, website: 'https://a.test' }),
            jupiterToken(MINT_B),
        ]);

        expect(await lookup([MINT_A, MINT_B])).toEqual(resolved(redactedTokenInfo(MINT_A, true), tokenInfo(MINT_B)));
    });

    it('should drop a token for a mint that was not requested', async () => {
        jupiterAnswers([jupiterToken(MINT_A), jupiterToken(MINT_B)]);

        expect(await lookup([MINT_A])).toEqual(resolved(tokenInfo(MINT_A)));
    });

    it.each([
        ['rate-limited', 'a warning', 429, Logger.warn],
        ['unavailable', 'an error', 401, Logger.error],
    ])('should return %s and report %s when Jupiter answers %i', async (kind, _, status, report) => {
        fetchMock.mockResolvedValue(new Response(null, { status }));

        expect(await lookup([MINT_A])).toEqual({ kind });
        expect(report).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ sentry: true }));
    });
});

describe('lookupTokenInfos with the on-chain fallback', () => {
    it('should add the on-chain token info of the mints Jupiter does not list', async () => {
        jupiterAnswers([jupiterToken(MINT_A)]);

        const result = await lookup([MINT_A, MINT_B], { includeOnChainFallback: true });

        expect(result).toEqual(resolved(tokenInfo(MINT_A), onChainTokenInfo(MINT_B)));
    });

    it('should read on-chain metadata without a Jupiter request on devnet', async () => {
        const result = await lookup([MINT_A], { cluster: Cluster.Devnet, includeOnChainFallback: true });

        expect(result).toEqual(resolved(onChainTokenInfo(MINT_A)));
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([
        ['without the option', [], { includeOnChainFallback: false }],
        ['when Jupiter lists every mint', [jupiterToken(MINT_A)], { includeOnChainFallback: true }],
        [
            'on a Custom cluster',
            [],
            { cluster: Cluster.Custom, genesisHash: GENESIS_HASHES.MAINNET, includeOnChainFallback: true },
        ],
    ])('should not read on-chain metadata %s', async (_, listed, options) => {
        jupiterAnswers(listed);

        await lookup([MINT_A], options);

        expect(getTokenInfosFromMetaplex).not.toHaveBeenCalled();
    });

    it('should return the Jupiter tokens and warn when the on-chain read throws', async () => {
        jupiterAnswers([jupiterToken(MINT_A)]);
        vi.mocked(getTokenInfosFromMetaplex).mockRejectedValue(new Error('rpc failed'));

        expect(await lookup([MINT_A, MINT_B], { includeOnChainFallback: true })).toEqual(resolved(tokenInfo(MINT_A)));
        expect(Logger.warn).toHaveBeenCalled();
    });

    it('should return a Jupiter failure without an on-chain read', async () => {
        fetchMock.mockResolvedValue(new Response(null, { status: 503 }));

        expect(await lookup([MINT_A], { includeOnChainFallback: true })).toEqual({ kind: 'unavailable' });
        expect(getTokenInfosFromMetaplex).not.toHaveBeenCalled();
    });
});

describe('lookupTokenInfo', () => {
    it('should return the lookup of the mint', async () => {
        jupiterAnswers([jupiterToken(MINT_A)]);

        const result = await lookupTokenInfo({ cluster: Cluster.Mainnet, genesisHash: undefined, mint: MINT_A });

        expect(result).toEqual({ kind: 'listed', token: tokenInfo(MINT_A) });
    });

    it('should return not-listed without a request for a mint that is not an address', async () => {
        const result = await lookupTokenInfo({ cluster: Cluster.Mainnet, genesisHash: undefined, mint: 'bonk' });

        expect(result).toEqual({ kind: 'not-listed' });
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe('lookupVerifiedTokenInfos', () => {
    it('should return the verified tokens among the addresses', async () => {
        jupiterAnswers([jupiterToken(MINT_A, { isVerified: true }), jupiterToken(MINT_B, { isVerified: true })]);

        expect(await lookupVerified([MINT_A, MINT_C])).toEqual(resolved(tokenInfo(MINT_A, true)));
    });

    it('should keep the verified list in the Next data cache, so the next lookup sends no request', async () => {
        jupiterAnswers([jupiterToken(MINT_A, { isVerified: true })]);

        await lookupVerified([MINT_A]);
        await lookupVerified([MINT_B]);

        expect(fetchMock).toHaveBeenCalledOnce();
    });

    it('should redact a mint added to NEXT_PUBLIC_BAD_TOKENS after the verified list was cached', async () => {
        jupiterAnswers([jupiterToken(MINT_A, { isVerified: true })]);
        await lookupVerified([MINT_A]);

        vi.stubEnv('NEXT_PUBLIC_BAD_TOKENS', MINT_A);

        expect(await lookupVerified([MINT_A])).toEqual(resolved(redactedTokenInfo(MINT_A, true)));
    });

    it.each([
        ['rate-limited', 429, Logger.warn],
        ['unavailable', 401, Logger.error],
    ])('should return %s, report it, and ask Jupiter again on the next lookup', async (kind, status, report) => {
        fetchMock.mockResolvedValueOnce(new Response(null, { status }));
        jupiterAnswers([jupiterToken(MINT_A, { isVerified: true })]);

        expect(await lookupVerified([MINT_A])).toEqual({ kind });
        expect(report).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ sentry: true }));
        expect(await lookupVerified([MINT_A])).toEqual(resolved(tokenInfo(MINT_A, true)));
    });
});

it.each([
    ['the search', maxDuration, () => lookup([MINT_A])],
    ['the verified list', verifiedMaxDuration, () => lookupVerified([MINT_A])],
])(
    'should time out %s below half the route maxDuration and below the browser timeout',
    async (_, routeMaxDuration, act) => {
        const timeout = vi.spyOn(AbortSignal, 'timeout');

        await act();

        const [ms] = timeout.mock.calls[0];
        expect(fetchMock.mock.calls[0][1]?.signal).toBe(timeout.mock.results[0].value);
        expect(ms).toBeLessThanOrEqual((routeMaxDuration * 1000) / 2);
        expect(ms).toBeLessThan(JUPITER_ROUTE_TIMEOUT_MS);
    },
);

it.each([
    ['the search', () => lookup([MINT_A])],
    ['the verified list', () => lookupVerified([MINT_A])],
])(
    'should return unavailable and report an error without a request for %s when JUPITER_API_KEY is not set',
    async (_, act) => {
        vi.stubEnv('JUPITER_API_KEY', '');

        expect(await act()).toEqual({ kind: 'unavailable' });
        expect(fetchMock).not.toHaveBeenCalled();
        expect(Logger.error).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ sentry: true }));
    },
);

function lookup(
    addresses: string[],
    options: Partial<Parameters<typeof lookupTokenInfos>[0]> = {},
): Promise<TokenInfosLookup> {
    return lookupTokenInfos({ addresses, cluster: Cluster.Mainnet, genesisHash: undefined, ...options });
}

function lookupVerified(addresses: string[]): Promise<TokenInfosLookup> {
    return lookupVerifiedTokenInfos({ addresses });
}

function jupiterAnswers(tokens: unknown[]): void {
    fetchMock.mockImplementation(async () => Response.json(tokens));
}

function onChainTokenInfo(address: string): TokenInfo {
    return { ...tokenInfo(address), symbol: 'ON-CHAIN' };
}

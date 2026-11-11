import { gen } from '@__fixtures__/gen';
import { GENESIS_HASHES } from '@entities/chain-id/lib/const';
import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { tokenInfo } from '../../__fixtures__/token-info';
import { type TokenInfo } from '../../lib/types';
import { fetchTokenInfoFromApi, fetchTokenInfosFromApi, lookupTokenInfo } from '../fetch-token-infos-from-api';

vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

const MINT_A = gen.address();
const MINT_B = gen.address();

describe('fetchTokenInfosFromApi', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('should post the addresses to the token info route and resolve its content', async () => {
        vi.mocked(fetch).mockResolvedValue(Response.json({ content: [tokenInfo(MINT_A), tokenInfo(MINT_B)] }));

        const tokens = await fetchTokenInfosFromApi(request({ includeOnChainFallback: true }));

        expect(tokens).toEqual([tokenInfo(MINT_A), tokenInfo(MINT_B)]);
        expect(sentRequest()).toEqual({
            body: { addresses: [MINT_A, MINT_B], cluster: Cluster.MainnetBeta, includeOnChainFallback: true },
            method: 'POST',
            url: '/api/token-info',
        });
    });

    it('should send the genesis hash of a Custom cluster', async () => {
        vi.mocked(fetch).mockResolvedValue(Response.json({ content: [] }));

        await fetchTokenInfosFromApi(request({ cluster: Cluster.Custom, genesisHash: GENESIS_HASHES.MAINNET }));

        expect(sentRequest().body).toEqual({
            addresses: [MINT_A, MINT_B],
            cluster: Cluster.Custom,
            genesisHash: GENESIS_HASHES.MAINNET,
            includeOnChainFallback: false,
        });
    });

    it('should get one address without the fallback from the mint path', async () => {
        vi.mocked(fetch).mockResolvedValue(Response.json({ content: [tokenInfo(MINT_A)] }));

        const tokens = await fetchTokenInfosFromApi(request({ addresses: [MINT_A] }));

        expect(tokens).toEqual([tokenInfo(MINT_A)]);
        expect(sentRequest()).toEqual({
            body: undefined,
            method: 'GET',
            url: `/api/token-info/${MINT_A}?cluster=${Cluster.MainnetBeta}`,
        });
    });

    it('should leave the genesis hash out of the query on a named cluster', async () => {
        vi.mocked(fetch).mockResolvedValue(Response.json({ content: [] }));

        await fetchTokenInfosFromApi(request({ addresses: [MINT_A], genesisHash: GENESIS_HASHES.MAINNET }));

        expect(sentRequest().url).toBe(`/api/token-info/${MINT_A}?cluster=${Cluster.MainnetBeta}`);
    });

    it('should send the genesis hash of a Custom cluster in the query', async () => {
        vi.mocked(fetch).mockResolvedValue(Response.json({ content: [] }));

        await fetchTokenInfosFromApi(
            request({ addresses: [MINT_A], cluster: Cluster.Custom, genesisHash: GENESIS_HASHES.MAINNET }),
        );

        expect(sentRequest().url).toBe(
            `/api/token-info/${MINT_A}?cluster=${Cluster.Custom}&genesisHash=${GENESIS_HASHES.MAINNET}`,
        );
    });

    it('should post one address with the on-chain fallback', async () => {
        vi.mocked(fetch).mockResolvedValue(Response.json({ content: [] }));

        await fetchTokenInfosFromApi(request({ addresses: [MINT_A], includeOnChainFallback: true }));

        expect(sentRequest()).toEqual({
            body: { addresses: [MINT_A], cluster: Cluster.MainnetBeta, includeOnChainFallback: true },
            method: 'POST',
            url: '/api/token-info',
        });
    });

    it('should post two addresses without the fallback', async () => {
        vi.mocked(fetch).mockResolvedValue(Response.json({ content: [] }));

        await fetchTokenInfosFromApi(request());

        expect(sentRequest()).toEqual({
            body: { addresses: [MINT_A, MINT_B], cluster: Cluster.MainnetBeta, includeOnChainFallback: false },
            method: 'POST',
            url: '/api/token-info',
        });
    });

    it('should resolve undefined without a request on a Custom cluster with no genesis hash', async () => {
        await expect(fetchTokenInfosFromApi(request({ cluster: Cluster.Custom }))).resolves.toBeUndefined();
        expect(fetch).not.toHaveBeenCalled();
    });

    it('should resolve an empty list without a request when there are no addresses', async () => {
        await expect(fetchTokenInfosFromApi(request({ addresses: [] }))).resolves.toEqual([]);
        expect(fetch).not.toHaveBeenCalled();
    });

    it.each([
        ['devnet', Cluster.Devnet, undefined],
        ['testnet', Cluster.Testnet, undefined],
        ['a Custom cluster with the devnet genesis hash', Cluster.Custom, GENESIS_HASHES.DEVNET],
    ])('should resolve no tokens without a request on %s without the fallback', async (_, cluster, hash) => {
        const offMainnetRequest = request({ cluster, genesisHash: hash, includeOnChainFallback: false });

        await expect(fetchTokenInfosFromApi(offMainnetRequest)).resolves.toEqual([]);
        expect(fetch).not.toHaveBeenCalled();
    });

    it('should request devnet tokens with the on-chain fallback', async () => {
        vi.mocked(fetch).mockResolvedValue(Response.json({ content: [tokenInfo(MINT_A)] }));

        const tokens = await fetchTokenInfosFromApi(request({ cluster: Cluster.Devnet, includeOnChainFallback: true }));

        expect(tokens).toEqual([tokenInfo(MINT_A)]);
    });

    it.each([404, 429, 500])('should resolve undefined for a %i response', async status => {
        vi.mocked(fetch).mockResolvedValue(new Response(null, { status }));

        await expect(fetchTokenInfosFromApi(request())).resolves.toBeUndefined();
    });

    it.each([
        ['an empty object', {}],
        ['an object with null content', { content: null }],
        ['an object with string content', { content: 'not a list' }],
        ['a number', 42],
        ['null', null],
        ['a bare array', [tokenInfo(MINT_A)]],
    ])('should warn and resolve undefined for a 200 body that is %s', async (_, body) => {
        vi.mocked(fetch).mockResolvedValue(Response.json(body));

        await expect(fetchTokenInfosFromApi(request())).resolves.toBeUndefined();
        expect(Logger.warn).toHaveBeenCalledWith(
            '[token-info] Token info response was not a token array',
            expect.anything(),
        );
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it.each([
        ['null', null],
        ['a string', MINT_A],
        ['an array', [tokenInfo(MINT_A)]],
        ['an entry with no address', withoutField('address')],
        ['an entry with no decimals', withoutField('decimals')],
        ['an entry with no logoURI', withoutField('logoURI')],
        ['an entry with no name', withoutField('name')],
        ['an entry with no symbol', withoutField('symbol')],
        ['an entry with no verified flag', withoutField('verified')],
        ['an entry with a null verified flag', { ...tokenInfo(MINT_A), verified: null }],
        ['an entry with string decimals', { ...tokenInfo(MINT_A), decimals: '6' }],
        ['an entry with a numeric symbol', { ...tokenInfo(MINT_A), symbol: 1 }],
    ])('should drop %s, resolve the other entries and log the count', async (_, malformed) => {
        vi.mocked(fetch).mockResolvedValue(Response.json({ content: [malformed, tokenInfo(MINT_B, true)] }));

        await expect(fetchTokenInfosFromApi(request())).resolves.toEqual([tokenInfo(MINT_B, true)]);
        expect(Logger.warn).toHaveBeenCalledWith('[token-info] Dropped malformed token info entries', {
            sentry: 'always',
            sentryExtras: { cluster: Cluster.MainnetBeta, malformed: 1, total: 2 },
        });
    });

    it('should resolve no tokens and log the count once when every entry is malformed', async () => {
        vi.mocked(fetch).mockResolvedValue(
            Response.json({ content: [withoutField('verified'), withoutField('name')] }),
        );

        await expect(fetchTokenInfosFromApi(request())).resolves.toEqual([]);
        expect(Logger.warn).toHaveBeenCalledTimes(1);
        expect(Logger.warn).toHaveBeenCalledWith('[token-info] Dropped malformed token info entries', {
            sentry: 'always',
            sentryExtras: { cluster: Cluster.MainnetBeta, malformed: 2, total: 2 },
        });
    });

    it('should keep an entry with a logo URI and an entry with null decimals', async () => {
        const withLogo = { ...tokenInfo(MINT_A), logoURI: 'https://example.com/logo.png' };
        const withoutDecimals = { ...tokenInfo(MINT_B), decimals: null };
        vi.mocked(fetch).mockResolvedValue(Response.json({ content: [withLogo, withoutDecimals] }));

        await expect(fetchTokenInfosFromApi(request())).resolves.toEqual([withLogo, withoutDecimals]);
        expect(Logger.warn).not.toHaveBeenCalled();
    });

    it('should resolve undefined for a 200 body that is not JSON', async () => {
        vi.mocked(fetch).mockResolvedValue(new Response('<html></html>', { status: 200 }));

        await expect(fetchTokenInfosFromApi(request())).resolves.toBeUndefined();
    });

    it('should resolve undefined when the request fails', async () => {
        vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));

        await expect(fetchTokenInfosFromApi(request())).resolves.toBeUndefined();
    });

    it('should resolve undefined when the signal aborts the request', async () => {
        vi.mocked(fetch).mockImplementation(
            (_, init) =>
                new Promise((_resolve, reject) => {
                    init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
                }),
        );
        const controller = new AbortController();

        const pending = fetchTokenInfosFromApi(request({ signal: controller.signal }));
        controller.abort();

        await expect(pending).resolves.toBeUndefined();
    });
});

describe('fetchTokenInfoFromApi', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should request one mint without the on-chain fallback and resolve its token', async () => {
        vi.mocked(fetch).mockResolvedValue(Response.json({ content: [tokenInfo(MINT_A)] }));

        const token = await fetchTokenInfoFromApi(new PublicKey(MINT_A), Cluster.MainnetBeta);

        expect(token).toEqual(tokenInfo(MINT_A));
        expect(sentRequest()).toEqual({
            body: undefined,
            method: 'GET',
            url: `/api/token-info/${MINT_A}?cluster=${Cluster.MainnetBeta}`,
        });
    });

    it('should resolve undefined when the route does not list the mint', async () => {
        vi.mocked(fetch).mockResolvedValue(Response.json({ content: [] }));

        await expect(fetchTokenInfoFromApi(new PublicKey(MINT_A), Cluster.MainnetBeta)).resolves.toBeUndefined();
    });
});

describe('lookupTokenInfo', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should request one mint without the on-chain fallback and answer listed', async () => {
        vi.mocked(fetch).mockResolvedValue(Response.json({ content: [tokenInfo(MINT_A, true)] }));

        const lookup = await lookupTokenInfo({ address: MINT_A, cluster: Cluster.MainnetBeta });

        expect(lookup).toEqual({ kind: 'listed', token: tokenInfo(MINT_A, true) });
        expect(sentRequest()).toEqual({
            body: undefined,
            method: 'GET',
            url: `/api/token-info/${MINT_A}?cluster=${Cluster.MainnetBeta}`,
        });
    });

    it('should answer not-listed when the route lists no token', async () => {
        vi.mocked(fetch).mockResolvedValue(Response.json({ content: [] }));

        await expect(lookupTokenInfo({ address: MINT_A, cluster: Cluster.MainnetBeta })).resolves.toEqual({
            kind: 'not-listed',
        });
    });

    it('should answer rate-limited for a GET answered 429', async () => {
        vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 429 }));

        await expect(lookupTokenInfo({ address: MINT_A, cluster: Cluster.MainnetBeta })).resolves.toEqual({
            kind: 'rate-limited',
        });
        expect(sentRequest().method).toBe('GET');
    });

    it.each([
        ['a 503 response', () => vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 503 }))],
        ['a body that is not a token array', () => vi.mocked(fetch).mockResolvedValue(Response.json({}))],
        ['a failed request', () => vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))],
    ])('should answer unavailable for %s', async (_, respond) => {
        respond();

        await expect(lookupTokenInfo({ address: MINT_A, cluster: Cluster.MainnetBeta })).resolves.toEqual({
            kind: 'unavailable',
        });
    });

    it('should answer unavailable without a request on a Custom cluster with no genesis hash', async () => {
        await expect(lookupTokenInfo({ address: MINT_A, cluster: Cluster.Custom })).resolves.toEqual({
            kind: 'unavailable',
        });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('should answer not-listed without a request on devnet', async () => {
        await expect(lookupTokenInfo({ address: MINT_A, cluster: Cluster.Devnet })).resolves.toEqual({
            kind: 'not-listed',
        });
        expect(fetch).not.toHaveBeenCalled();
    });
});

type Request = Parameters<typeof fetchTokenInfosFromApi>[0];

function request(overrides: Partial<Request> = {}): Request {
    return {
        addresses: [MINT_A, MINT_B],
        cluster: Cluster.MainnetBeta,
        genesisHash: undefined,
        includeOnChainFallback: false,
        ...overrides,
    };
}

function withoutField(field: keyof TokenInfo): Record<string, unknown> {
    return Object.fromEntries(Object.entries(tokenInfo(MINT_A)).filter(([key]) => key !== field));
}

function sentRequest(): { body: unknown; method: string | undefined; url: string } {
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    const body = init?.body === undefined ? undefined : JSON.parse(String(init.body));
    return { body, method: init?.method, url: String(url) };
}

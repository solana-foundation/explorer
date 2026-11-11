import { gen } from '@__fixtures__/gen';
import { act, renderHook, type RenderHookResult } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import type { SWRConfiguration } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FAST_RETRY, renderHookWithRevalidate, settleRetries, swrWrapper, waitForHook } from '@/app/__tests__/swr-hook';
import { isAccountRefreshKey } from '@/app/shared/lib/account-refresh-key';

import { tokenInfo } from '../../__fixtures__/token-info';
import { useMintTokenInfo } from '../use-mint-token-info';

const MINT = gen.address(1);
const RPC_URL = 'https://api.mainnet-beta.solana.com';

describe('useMintTokenInfo', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should return the token of a listed mint', async () => {
        respond(200, { content: [tokenInfo(MINT, true)] });

        const { result } = renderMintTokenInfo();

        await waitForHook(() => expect(result.current).toEqual({ isLoading: false, tokenInfo: tokenInfo(MINT, true) }));
        expect(requestedUrls()).toEqual([`/api/token-info/${MINT}?cluster=${Cluster.MainnetBeta}`]);
    });

    it('should return no token info for a mint that is not listed', async () => {
        respond(200, { content: [] });

        const { result } = renderMintTokenInfo();

        await waitForHook(() => expect(fetch).toHaveBeenCalledTimes(1));
        await waitForHook(() => expect(result.current).toEqual({ isLoading: false, tokenInfo: undefined }));
    });

    it.each([429, 503])('should return no token info after one request and no retry for a %i', async status => {
        respond(status, { error: 'Token info unavailable' });

        const { result } = renderMintTokenInfo({ config: FAST_RETRY });

        await waitForHook(() => expect(fetch).toHaveBeenCalledTimes(1));
        await waitForHook(() => expect(result.current.isLoading).toBe(false));
        await act(settleRetries);
        expect(result.current).toEqual({ isLoading: false, tokenInfo: undefined });
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it.each([429, 503])('should request the token info again on the next mount after a %i', async status => {
        const cache = new Map();
        respond(status, { error: 'Token info unavailable' });
        const { result: failed, unmount } = renderMintTokenInfo({ config: { provider: () => cache } });
        await waitForHook(() => expect(fetch).toHaveBeenCalledTimes(1));
        await waitForHook(() => expect(failed.current.isLoading).toBe(false));
        unmount();

        respond(200, { content: [tokenInfo(MINT, true)] });
        const { result } = renderMintTokenInfo({ config: { provider: () => cache } });

        await waitForHook(() => expect(result.current.tokenInfo).toEqual(tokenInfo(MINT, true)));
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should request the token info again when a refresh matches the account of the mint', async () => {
        respond(200, { content: [tokenInfo(MINT, true)] });
        const { result } = renderHookWithRevalidate(() => useMintTokenInfo(hookProps()));
        await waitForHook(() => expect(result.current.state.tokenInfo).toEqual(tokenInfo(MINT, true)));

        await act(() => result.current.revalidate(key => isAccountRefreshKey(key, RPC_URL, MINT)));

        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it.each([
        ['a mint that is not listed', 200, { content: [] }],
        ['a failed request', 503, { error: 'Token info unavailable' }],
    ])('should not report loading while a refresh refetches %s', async (_, status, body) => {
        respond(status, body);
        const { result } = renderHookWithRevalidate(() => useMintTokenInfo(hookProps()));
        await waitForHook(() => expect(fetch).toHaveBeenCalledTimes(1));
        await waitForHook(() => expect(result.current.state.isLoading).toBe(false));

        vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
        act(() => {
            void result.current.revalidate(key => isAccountRefreshKey(key, RPC_URL, MINT));
        });

        await waitForHook(() => expect(fetch).toHaveBeenCalledTimes(2));
        expect(result.current.state.isLoading).toBe(false);
    });

    it.each([
        ['no genesis hash', undefined],
        ['an unknown genesis hash', 'unknown-genesis-hash'],
    ])('should send no request on a Custom cluster with %s', async (_, genesisHash) => {
        const { result } = renderMintTokenInfo({ cluster: Cluster.Custom, genesisHash });

        expect(result.current).toEqual({ isLoading: false, tokenInfo: undefined });
        await act(settleRetries);
        expect(fetch).not.toHaveBeenCalled();
    });

    it('should send no request without a mint', async () => {
        const { result } = renderMintTokenInfo({ mint: undefined });

        expect(result.current).toEqual({ isLoading: false, tokenInfo: undefined });
        await act(settleRetries);
        expect(fetch).not.toHaveBeenCalled();
    });
});

type HookProps = Parameters<typeof useMintTokenInfo>[0];

function hookProps(overrides: Partial<HookProps> = {}): HookProps {
    return { cluster: Cluster.MainnetBeta, genesisHash: undefined, mint: MINT, url: RPC_URL, ...overrides };
}

function renderMintTokenInfo({
    config,
    ...overrides
}: Partial<HookProps> & { config?: SWRConfiguration } = {}): RenderHookResult<
    ReturnType<typeof useMintTokenInfo>,
    unknown
> {
    return renderHook(() => useMintTokenInfo(hookProps(overrides)), { wrapper: swrWrapper(config) });
}

function respond(status: number, body: unknown): void {
    vi.mocked(fetch).mockImplementation(async () => Response.json(body, { status }));
}

function requestedUrls(): string[] {
    return vi.mocked(fetch).mock.calls.map(([input]) => String(input));
}

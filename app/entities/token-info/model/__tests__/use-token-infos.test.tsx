import { gen } from '@__fixtures__/gen';
import { ChainId, GENESIS_HASHES } from '@entities/chain-id';
import { act, renderHook } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { unstable_serialize } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    FAST_RETRY,
    refocusTab,
    renderHookWithRevalidate,
    settleRetries,
    swrWrapper,
    UNTHROTTLED_FOCUS,
    waitForHook,
} from '@/app/__tests__/swr-hook';

import { tokenInfo } from '../../__fixtures__/token-info';
import { lookupTokenInfo } from '../../api/lookup-token-info';
import type { TokenInfoLookup } from '../../lib/token-info-lookup';
import type { TokenInfo } from '../../lib/types';
import { getTokenInfosSwrKey, isTokenInfoSwrKey, useTokenInfo, useTokenInfos } from '../use-token-infos';

vi.mock('../../api/lookup-token-info', () => ({ lookupTokenInfo: vi.fn() }));

const mockedLookup = vi.mocked(lookupTokenInfo);

const wrapper = swrWrapper();

const MINT_A = gen.address(1);
const MINT_B = gen.address(2);

describe('useTokenInfos', () => {
    beforeEach(() => {
        mockedLookup.mockReset();
        mockListedTokens([]);
    });

    it('should resolve the mints and expose the listed ones keyed by address', async () => {
        mockListedTokens([tokenInfo(MINT_A)]);
        const mints = [MINT_A, MINT_B];

        const { result } = renderHook(
            () => useTokenInfos({ cluster: Cluster.Mainnet, genesisHash: undefined, mints }),
            { wrapper },
        );

        await waitForHook(() => expect(result.current.tokenInfos.get(MINT_A)).toEqual(tokenInfo(MINT_A)));
        expect(result.current.tokenInfos.has(MINT_B)).toBe(false);
        expect(mockedLookup).toHaveBeenCalledWith({
            cluster: Cluster.Mainnet,
            genesisHash: undefined,
            includeOnChainFallback: false,
            mint: MINT_A,
        });
    });

    it('should cache a list with the on-chain fallback separately from the same list without it', async () => {
        const mints = [MINT_A];
        mockedLookup.mockImplementation(async ({ includeOnChainFallback, mint }) =>
            includeOnChainFallback ? { kind: 'listed', token: tokenInfo(mint) } : { kind: 'not-listed' },
        );

        const { result } = renderHook(
            () => ({
                withFallback: useTokenInfos({
                    cluster: Cluster.Mainnet,
                    genesisHash: undefined,
                    includeOnChainFallback: true,
                    mints,
                }),
                withoutFallback: useTokenInfos({ cluster: Cluster.Mainnet, genesisHash: undefined, mints }),
            }),
            { wrapper },
        );

        await waitForHook(() => expect(result.current.withoutFallback.isLoading).toBe(false));
        await waitForHook(() => expect(result.current.withFallback.isLoading).toBe(false));
        expect(result.current.withFallback.tokenInfos.has(MINT_A)).toBe(true);
        expect(result.current.withoutFallback.tokenInfos.size).toBe(0);
    });

    it('should fetch again on a remount after the lookup of one mint failed', async () => {
        const mints = [MINT_A, MINT_B];
        const cache = new Map();
        const cachedWrapper = swrWrapper({ dedupingInterval: 0, provider: () => cache });
        mockedLookup.mockImplementation(async ({ mint }) =>
            mint === MINT_A ? { kind: 'listed', token: tokenInfo(mint) } : { kind: 'unavailable' },
        );

        const { result: failed, unmount } = renderHook(
            () => useTokenInfos({ cluster: Cluster.Mainnet, genesisHash: undefined, mints }),
            {
                wrapper: cachedWrapper,
            },
        );
        await waitForHook(() => expect(failed.current.isLoading).toBe(false));
        unmount();

        mockListedTokens([tokenInfo(MINT_A), tokenInfo(MINT_B)]);
        const { result } = renderHook(
            () => useTokenInfos({ cluster: Cluster.Mainnet, genesisHash: undefined, mints }),
            { wrapper: cachedWrapper },
        );

        await waitForHook(() => expect(result.current.tokenInfos.get(MINT_B)).toEqual(tokenInfo(MINT_B)));
    });

    it('should not fetch again on a remount when the mint is not listed', async () => {
        const mints = [MINT_A];
        const cache = new Map();
        const cachedWrapper = swrWrapper({ dedupingInterval: 0, provider: () => cache });

        const { result: cached, unmount } = renderHook(
            () => useTokenInfos({ cluster: Cluster.Mainnet, genesisHash: undefined, mints }),
            {
                wrapper: cachedWrapper,
            },
        );
        await waitForHook(() => expect(cached.current.isLoading).toBe(false));
        unmount();

        renderHook(() => useTokenInfos({ cluster: Cluster.Mainnet, genesisHash: undefined, mints }), {
            wrapper: cachedWrapper,
        });
        await act(settleRetries);

        expect(mockedLookup).toHaveBeenCalledTimes(1);
    });

    it('should not retry a failed lookup while mounted', async () => {
        const mints = [MINT_A];
        mockedLookup.mockResolvedValue({ kind: 'rate-limited' });

        const { result } = renderHook(
            () => useTokenInfos({ cluster: Cluster.Mainnet, genesisHash: undefined, mints }),
            {
                wrapper: swrWrapper(FAST_RETRY),
            },
        );
        await waitForHook(() => expect(result.current.isLoading).toBe(false));
        await act(settleRetries);

        expect(mockedLookup).toHaveBeenCalledTimes(1);
    });

    it('should report loading until the lookup settles', async () => {
        const mints = [MINT_A];

        const { result } = renderHook(
            () => useTokenInfos({ cluster: Cluster.Mainnet, genesisHash: undefined, mints }),
            { wrapper },
        );

        expect(result.current.isLoading).toBe(true);
        await waitForHook(() => expect(result.current.isLoading).toBe(false));
    });

    it('should not report loading while a revalidation refetches a failed lookup', async () => {
        const mints = [MINT_A];
        mockedLookup.mockResolvedValueOnce({ kind: 'unavailable' });
        const { result } = renderHookWithRevalidate(() =>
            useTokenInfos({ cluster: Cluster.Mainnet, genesisHash: undefined, mints }),
        );
        await waitForHook(() => expect(result.current.state.isLoading).toBe(false));

        mockedLookup.mockReturnValue(new Promise(() => {}));
        act(() => {
            void result.current.revalidate(key => isTokenInfoSwrKey(key, MINT_A));
        });

        await waitForHook(() => expect(mockedLookup).toHaveBeenCalledTimes(2));
        expect(result.current.state.isLoading).toBe(false);
    });

    it('should replace a cached answer when a revalidation finds the mint listed', async () => {
        const mints = [MINT_A];
        const { result } = renderHookWithRevalidate(() =>
            useTokenInfos({ cluster: Cluster.Mainnet, genesisHash: undefined, mints }),
        );
        await waitForHook(() => expect(result.current.state.isLoading).toBe(false));

        mockListedTokens([tokenInfo(MINT_A)]);
        await act(() => result.current.revalidate(key => isTokenInfoSwrKey(key, MINT_A)));

        expect(result.current.state.tokenInfos.get(MINT_A)).toEqual(tokenInfo(MINT_A));
    });

    it('should expose an empty map while loading rather than undefined', () => {
        const { result } = renderHook(
            () => useTokenInfos({ cluster: Cluster.Mainnet, genesisHash: undefined, mints: [MINT_A] }),
            { wrapper },
        );

        expect(result.current.tokenInfos.size).toBe(0);
    });

    it('should not fetch for an empty mint list', async () => {
        const { result } = renderHook(
            () => useTokenInfos({ cluster: Cluster.Mainnet, genesisHash: undefined, mints: [] }),
            { wrapper },
        );

        await waitForHook(() => expect(result.current.isLoading).toBe(false));
        expect(mockedLookup).not.toHaveBeenCalled();
        expect(result.current.tokenInfos.size).toBe(0);
    });

    it('should not refetch when the caller re-renders with a stable mint list', async () => {
        const mints = [MINT_A, MINT_B];

        const { rerender } = renderHook(
            () => useTokenInfos({ cluster: Cluster.Mainnet, genesisHash: undefined, mints }),
            { wrapper },
        );
        await waitForHook(() => expect(mockedLookup).toHaveBeenCalledTimes(2));

        rerender();
        rerender();

        expect(mockedLookup).toHaveBeenCalledTimes(2);
    });

    it('should refetch when the cluster changes', async () => {
        const mints = [MINT_A];

        const { rerender } = renderHook(({ cluster }) => useTokenInfos({ cluster, genesisHash: undefined, mints }), {
            initialProps: { cluster: Cluster.Mainnet },
            wrapper,
        });
        await waitForHook(() => expect(mockedLookup).toHaveBeenCalledTimes(1));

        rerender({ cluster: Cluster.Devnet });

        await waitForHook(() => expect(mockedLookup).toHaveBeenCalledTimes(2));
        expect(mockedLookup).toHaveBeenLastCalledWith(
            expect.objectContaining({ cluster: Cluster.Devnet, genesisHash: undefined, mint: MINT_A }),
        );
    });

    it('should refetch when a Custom cluster changes to the named cluster of the same chain', async () => {
        const mints = [MINT_A];
        const { rerender } = renderHook(
            ({ cluster, genesisHash }) => useTokenInfos({ cluster, genesisHash, includeOnChainFallback: true, mints }),
            {
                initialProps: {
                    cluster: Cluster.Custom,
                    genesisHash: GENESIS_HASHES.DEVNET as string | undefined,
                },
                wrapper,
            },
        );
        await waitForHook(() => expect(mockedLookup).toHaveBeenCalledTimes(1));

        rerender({ cluster: Cluster.Devnet, genesisHash: undefined });

        await waitForHook(() => expect(mockedLookup).toHaveBeenCalledTimes(2));
    });

    it('should refetch when the mint list changes', async () => {
        const { rerender } = renderHook(
            ({ mints }) => useTokenInfos({ cluster: Cluster.Mainnet, genesisHash: undefined, mints }),
            {
                initialProps: { mints: [MINT_A] },
                wrapper,
            },
        );
        await waitForHook(() => expect(mockedLookup).toHaveBeenCalledTimes(1));

        rerender({ mints: [MINT_A, MINT_B] });

        await waitForHook(() => expect(mockedLookup).toHaveBeenCalledTimes(3));
    });

    it('should not refetch when an equal but freshly allocated mint list arrives', async () => {
        const { rerender } = renderHook(
            ({ mints }) => useTokenInfos({ cluster: Cluster.Mainnet, genesisHash: undefined, mints }),
            {
                initialProps: { mints: [MINT_A, MINT_B] },
                wrapper,
            },
        );
        await waitForHook(() => expect(mockedLookup).toHaveBeenCalledTimes(2));

        rerender({ mints: [MINT_A, MINT_B] });

        expect(mockedLookup).toHaveBeenCalledTimes(2);
    });

    it('should not refetch when the tab regains focus', async () => {
        const mints = [MINT_A];
        renderHook(() => useTokenInfos({ cluster: Cluster.Mainnet, genesisHash: undefined, mints }), {
            wrapper: swrWrapper(UNTHROTTLED_FOCUS),
        });
        await waitForHook(() => expect(mockedLookup).toHaveBeenCalledTimes(1));

        await refocusTab();
        await act(settleRetries);

        expect(mockedLookup).toHaveBeenCalledTimes(1);
    });

    it('should forward the genesis hash', async () => {
        const mints = [MINT_A];

        renderHook(() => useTokenInfos({ cluster: Cluster.Custom, genesisHash: GENESIS_HASHES.MAINNET, mints }), {
            wrapper,
        });

        await waitForHook(() =>
            expect(mockedLookup).toHaveBeenCalledWith(
                expect.objectContaining({
                    cluster: Cluster.Custom,
                    genesisHash: GENESIS_HASHES.MAINNET,
                    mint: MINT_A,
                }),
            ),
        );
    });

    it('should not fetch a custom cluster whose genesis hash resolves no chain id', async () => {
        const { result } = renderHook(
            () =>
                useTokenInfos({
                    cluster: Cluster.Custom,
                    genesisHash: 'not-a-genesis-hash',
                    mints: [MINT_A],
                }),
            {
                wrapper,
            },
        );

        await waitForHook(() => expect(result.current.isLoading).toBe(false));
        expect(mockedLookup).not.toHaveBeenCalled();
    });

    // Storybook seeds this cache entry to render rows without a route to answer the lookup.
    it('should read an entry seeded under getTokenInfosSwrKey', () => {
        const mints = [MINT_A, MINT_B];
        const seeded = {
            [unstable_serialize(getTokenInfosSwrKey({ chainId: ChainId.MAINNET, cluster: Cluster.Mainnet, mints }))]: [
                tokenInfo(MINT_A),
            ],
        };

        const { result } = renderHook(
            () => useTokenInfos({ cluster: Cluster.Mainnet, genesisHash: undefined, mints }),
            {
                wrapper: swrWrapper({ fallback: seeded, revalidateOnMount: false }),
            },
        );

        expect(result.current.tokenInfos.get(MINT_A)).toEqual(tokenInfo(MINT_A));
        expect(mockedLookup).not.toHaveBeenCalled();
    });

    // The hash resolves a render after the cluster does, and it changes nothing on a named
    // cluster, so keying on it would buy a second lookup of the whole list for the same answer.
    it('should not refetch when the genesis hash arrives late on a named cluster', async () => {
        const mints = [MINT_A];

        const { rerender } = renderHook(
            ({ genesisHash }) => useTokenInfos({ cluster: Cluster.Mainnet, genesisHash, mints }),
            {
                initialProps: { genesisHash: undefined as string | undefined },
                wrapper,
            },
        );
        await waitForHook(() => expect(mockedLookup).toHaveBeenCalledTimes(1));

        rerender({ genesisHash: GENESIS_HASHES.MAINNET });

        expect(mockedLookup).toHaveBeenCalledTimes(1);
    });
});

describe('useTokenInfo', () => {
    beforeEach(() => {
        mockedLookup.mockReset();
        mockListedTokens([tokenInfo(MINT_A)]);
    });

    it.each<[string, TokenInfoLookup, ReturnType<typeof useTokenInfo>]>([
        [
            'listed',
            { kind: 'listed', token: tokenInfo(MINT_A) },
            { isLoading: false, kind: 'listed', tokenInfo: tokenInfo(MINT_A) },
        ],
        ['not listed', { kind: 'not-listed' }, { isLoading: false, kind: 'not-listed', tokenInfo: undefined }],
        ['rate limited', { kind: 'rate-limited' }, { isLoading: false, kind: 'rate-limited', tokenInfo: undefined }],
        ['unavailable', { kind: 'unavailable' }, { isLoading: false, kind: 'unavailable', tokenInfo: undefined }],
    ])('should return a mint that is %s', async (_, lookup, expected) => {
        mockedLookup.mockResolvedValue(lookup);

        const { result } = renderHook(
            () => useTokenInfo({ cluster: Cluster.Mainnet, genesisHash: undefined, mint: MINT_A }),
            { wrapper },
        );

        await waitForHook(() => expect(result.current).toEqual(expected));
    });

    it.each<TokenInfoLookup>([{ kind: 'not-listed' }, { kind: 'listed', token: tokenInfo(MINT_A) }])(
        'should keep a $kind answer when a revalidation fails',
        async loaded => {
            mockedLookup.mockResolvedValue(loaded);
            const { result } = renderHookWithRevalidate(() =>
                useTokenInfo({ cluster: Cluster.Mainnet, genesisHash: undefined, mint: MINT_A }),
            );
            await waitForHook(() => expect(result.current.state.kind).toBe(loaded.kind));

            mockedLookup.mockResolvedValue({ kind: 'rate-limited' });
            await act(() => result.current.revalidate(key => isTokenInfoSwrKey(key, MINT_A)));

            expect(mockedLookup).toHaveBeenCalledTimes(2);
            expect(result.current.state.kind).toBe(loaded.kind);
        },
    );

    it.each([
        ['without a mint', Cluster.Mainnet, undefined],
        ['on a Custom cluster before its genesis hash resolves', Cluster.Custom, MINT_A],
    ])('should return idle and not fetch %s', async (_, cluster, mint) => {
        const { result } = renderHook(() => useTokenInfo({ cluster, genesisHash: undefined, mint }), { wrapper });

        await act(settleRetries);
        expect(result.current).toEqual({ isLoading: false, kind: 'idle', tokenInfo: undefined });
        expect(mockedLookup).not.toHaveBeenCalled();
    });
});

describe('isTokenInfoSwrKey', () => {
    it.each([
        [
            'match',
            'the key of the mint',
            getTokenInfosSwrKey({ chainId: ChainId.MAINNET, cluster: Cluster.Mainnet, mints: [MINT_A] }),
        ],
        [
            'match',
            'the key of the mint with the fallback',
            getTokenInfosSwrKey({
                chainId: ChainId.DEVNET,
                cluster: Cluster.Devnet,
                includeOnChainFallback: true,
                mints: [MINT_A],
            }),
        ],
        [
            'not match',
            'the key of a list that holds the mint',
            getTokenInfosSwrKey({ chainId: ChainId.MAINNET, cluster: Cluster.Mainnet, mints: [MINT_A, MINT_B] }),
        ],
        [
            'not match',
            'the key of another mint',
            getTokenInfosSwrKey({ chainId: ChainId.MAINNET, cluster: Cluster.Mainnet, mints: [MINT_B] }),
        ],
        ['not match', 'a key of another family', ['account-refresh', MINT_A]],
    ])('should %s %s', (outcome, _, key) => {
        const matches = outcome === 'match';
        expect(isTokenInfoSwrKey(key, MINT_A)).toBe(matches);
    });
});

function mockListedTokens(tokens: TokenInfo[]): void {
    mockedLookup.mockImplementation(async ({ mint }): Promise<TokenInfoLookup> => {
        const token = tokens.find(entry => entry.address === mint);
        return token ? { kind: 'listed', token } : { kind: 'not-listed' };
    });
}

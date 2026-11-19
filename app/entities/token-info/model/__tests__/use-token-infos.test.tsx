import { gen } from '@__fixtures__/gen';
import { GENESIS_HASHES, GenesisHashFromString } from '@entities/chain-id';
import { act, renderHook } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { create } from 'superstruct';
import type { SWRConfiguration } from 'swr';
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
import { lookupTokenInfo, lookupVerifiedTokenInfos } from '../../api/lookup-token-info';
import type { TokenInfoLookup } from '../../lib/token-info-lookup';
import type { TokenInfo } from '../../lib/types';
import { useTokenInfo, useTokenInfos, useVerifiedTokenInfos } from '../use-token-infos';

vi.mock('../../api/lookup-token-info', () => ({ lookupTokenInfo: vi.fn(), lookupVerifiedTokenInfos: vi.fn() }));
vi.mock('@providers/cluster', () => ({ useCluster: () => ({ url: 'https://api.mainnet-beta.solana.com' }) }));

const MINT_A = gen.address(1);
const MINT_B = gen.address(2);

type Props = Parameters<typeof useTokenInfos>[0];

const MAINNET: Props = { cluster: Cluster.Mainnet, genesisHash: undefined, mints: [MINT_A] };

beforeEach(() => {
    vi.mocked(lookupTokenInfo).mockReset();
    vi.mocked(lookupVerifiedTokenInfos).mockReset();
    listOnly([]);
});

describe('useTokenInfos', () => {
    it('should report loading, then the listed mints keyed by address', async () => {
        listOnly([tokenInfo(MINT_A)]);

        const { result } = renderTokenInfos({ mints: [MINT_A, MINT_B] });

        expect(result.current.kind).toBe('loading');
        await waitForHook(() =>
            expect(result.current).toEqual({ kind: 'resolved', tokenInfos: new Map([[MINT_A, tokenInfo(MINT_A)]]) }),
        );
    });

    it('should cache a list with the on-chain fallback apart from the same list without it', async () => {
        vi.mocked(lookupTokenInfo).mockImplementation(async ({ includeOnChainFallback, mint }) =>
            includeOnChainFallback ? { kind: 'listed', token: tokenInfo(mint) } : { kind: 'not-listed' },
        );

        const { result } = renderHook(
            () => ({
                withFallback: useTokenInfos({ ...MAINNET, includeOnChainFallback: true }),
                withoutFallback: useTokenInfos(MAINNET),
            }),
            { wrapper: swrWrapper() },
        );

        await waitForHook(() => {
            expect(result.current.withFallback.tokenInfos.has(MINT_A)).toBe(true);
            expect(result.current.withoutFallback).toEqual({ kind: 'resolved', tokenInfos: new Map() });
        });
    });

    it('should look up the mints with the genesis hash of a Custom cluster', async () => {
        renderTokenInfos({ cluster: Cluster.Custom, genesisHash: GENESIS_HASHES.MAINNET });

        await waitForHook(() =>
            expect(lookupTokenInfo).toHaveBeenCalledWith(
                expect.objectContaining({ cluster: Cluster.Custom, genesisHash: GENESIS_HASHES.MAINNET, mint: MINT_A }),
            ),
        );
    });

    it.each([
        ['an empty mint list', { mints: [] }],
        ['a Custom cluster with no genesis hash', { cluster: Cluster.Custom }],
        [
            'a Custom cluster whose genesis hash names no chain',
            { cluster: Cluster.Custom, genesisHash: create(gen.blockhash(), GenesisHashFromString) },
        ],
    ])('should stay idle without a lookup for %s', async (_, props) => {
        const { result } = renderTokenInfos(props);
        await act(settleRetries);

        expect(result.current).toEqual({ kind: 'idle', tokenInfos: new Map() });
        expect(lookupTokenInfo).not.toHaveBeenCalled();
    });

    it.each([
        { change: 'an equal mint list arrives', from: MAINNET, lookups: 0, to: { ...MAINNET, mints: [MINT_A] } },
        {
            change: 'the genesis hash arrives on a named cluster',
            from: MAINNET,
            lookups: 0,
            to: { ...MAINNET, genesisHash: GENESIS_HASHES.MAINNET },
        },
        { change: 'the cluster changes', from: MAINNET, lookups: 1, to: { ...MAINNET, cluster: Cluster.Devnet } },
        { change: 'the mint list changes', from: MAINNET, lookups: 2, to: { ...MAINNET, mints: [MINT_A, MINT_B] } },
        {
            change: 'a Custom cluster changes to the named cluster of its chain',
            from: { ...MAINNET, cluster: Cluster.Custom, genesisHash: GENESIS_HASHES.DEVNET },
            lookups: 1,
            to: { ...MAINNET, cluster: Cluster.Devnet },
        },
    ])('should send $lookups more lookups when $change', async ({ from, lookups, to }) => {
        const { rerender } = renderTokenInfos(from);
        await waitForHook(() => expect(lookupTokenInfo).toHaveBeenCalledTimes(from.mints.length));

        rerender(to);
        await act(settleRetries);

        expect(lookupTokenInfo).toHaveBeenCalledTimes(from.mints.length + lookups);
    });

    it('should look up again on a remount after the lookup of one mint failed', async () => {
        const cache = sharedCache();
        vi.mocked(lookupTokenInfo).mockImplementation(async ({ mint }) =>
            mint === MINT_A ? { kind: 'listed', token: tokenInfo(mint) } : { kind: 'unavailable' },
        );
        await renderSettledThenUnmount({ mints: [MINT_A, MINT_B] }, cache);

        listOnly([tokenInfo(MINT_A), tokenInfo(MINT_B)]);
        const { result } = renderTokenInfos({ mints: [MINT_A, MINT_B] }, cache);

        await waitForHook(() => expect(result.current.tokenInfos.get(MINT_B)).toEqual(tokenInfo(MINT_B)));
    });

    it('should not look up again on a remount when the mint is not listed', async () => {
        const cache = sharedCache();
        await renderSettledThenUnmount({}, cache);

        renderTokenInfos({}, cache);
        await act(settleRetries);

        expect(lookupTokenInfo).toHaveBeenCalledOnce();
    });

    it('should not retry a failed lookup while mounted', async () => {
        vi.mocked(lookupTokenInfo).mockResolvedValue({ kind: 'rate-limited' });

        const { result } = renderTokenInfos({}, FAST_RETRY);
        await waitForHook(() => expect(result.current.kind).toBe('rate-limited'));
        await act(settleRetries);

        expect(lookupTokenInfo).toHaveBeenCalledOnce();
    });

    it('should not look up again when the tab regains focus', async () => {
        const { result } = renderTokenInfos({}, UNTHROTTLED_FOCUS);
        await waitForHook(() => expect(result.current.kind).toBe('resolved'));

        await refocusTab();
        await act(settleRetries);

        expect(lookupTokenInfo).toHaveBeenCalledOnce();
    });

    it('should not report loading while a revalidation retries a failed lookup', async () => {
        vi.mocked(lookupTokenInfo).mockResolvedValueOnce({ kind: 'unavailable' });
        const { result } = renderHookWithRevalidate(() => useTokenInfos(MAINNET));
        await waitForHook(() => expect(result.current.state.kind).toBe('unavailable'));

        vi.mocked(lookupTokenInfo).mockReturnValue(new Promise(() => {}));
        act(() => void result.current.revalidate(() => true));

        await waitForHook(() => expect(lookupTokenInfo).toHaveBeenCalledTimes(2));
        expect(result.current.state.kind).not.toBe('loading');
    });

    it('should replace a cached answer when a revalidation finds the mint listed', async () => {
        const { result } = renderHookWithRevalidate(() => useTokenInfos(MAINNET));
        await waitForHook(() => expect(result.current.state.kind).toBe('resolved'));

        listOnly([tokenInfo(MINT_A)]);
        await act(() => result.current.revalidate(() => true));

        expect(result.current.state.tokenInfos.get(MINT_A)).toEqual(tokenInfo(MINT_A));
    });
});

describe('useTokenInfo', () => {
    it.each<[TokenInfoLookup, TokenInfo | undefined]>([
        [{ kind: 'listed', token: tokenInfo(MINT_A) }, tokenInfo(MINT_A)],
        [{ kind: 'not-listed' }, undefined],
        [{ kind: 'rate-limited' }, undefined],
        [{ kind: 'unavailable' }, undefined],
    ])('should return a %o mint', async (lookup, expected) => {
        vi.mocked(lookupTokenInfo).mockResolvedValue(lookup);

        const { result } = renderHook(() => useTokenInfo({ ...MAINNET, mint: MINT_A }), { wrapper: swrWrapper() });

        await waitForHook(() =>
            expect(result.current).toEqual({ isLoading: false, kind: lookup.kind, tokenInfo: expected }),
        );
    });

    it('should return idle without a lookup for no mint', async () => {
        const { result } = renderHook(() => useTokenInfo({ ...MAINNET, mint: undefined }), { wrapper: swrWrapper() });
        await act(settleRetries);

        expect(result.current).toEqual({ isLoading: false, kind: 'idle', tokenInfo: undefined });
        expect(lookupTokenInfo).not.toHaveBeenCalled();
    });

    it.each<TokenInfoLookup>([{ kind: 'not-listed' }, { kind: 'listed', token: tokenInfo(MINT_A) }])(
        'should keep a $kind answer when a revalidation fails',
        async loaded => {
            vi.mocked(lookupTokenInfo).mockResolvedValue(loaded);
            const { result } = renderHookWithRevalidate(() => useTokenInfo({ ...MAINNET, mint: MINT_A }));
            await waitForHook(() => expect(result.current.state.kind).toBe(loaded.kind));

            vi.mocked(lookupTokenInfo).mockResolvedValue({ kind: 'rate-limited' });
            await act(() => result.current.revalidate(() => true));

            expect(lookupTokenInfo).toHaveBeenCalledTimes(2);
            expect(result.current.state.kind).toBe(loaded.kind);
        },
    );
});

describe('useVerifiedTokenInfos', () => {
    const mints = [MINT_A, MINT_B];
    const VERIFIED = new Map([[MINT_A, tokenInfo(MINT_A, true)]]);

    beforeEach(() => {
        vi.mocked(lookupVerifiedTokenInfos).mockResolvedValue({ kind: 'resolved', tokens: [...VERIFIED.values()] });
    });

    it.each([
        ['mainnet', Cluster.Mainnet, undefined],
        ['a Custom cluster with the mainnet genesis hash', Cluster.Custom, GENESIS_HASHES.MAINNET],
    ])('should report loading, then the verified mints on %s', async (_, cluster, genesisHash) => {
        const { result } = renderVerified({ cluster, genesisHash });

        expect(result.current.isLoading).toBe(true);
        await waitForHook(() => expect(result.current).toEqual({ isLoading: false, tokenInfos: VERIFIED }));
        expect(lookupVerifiedTokenInfos).toHaveBeenCalledWith({ addresses: mints });
    });

    it('should resolve no token info without a request on devnet', async () => {
        const { result } = renderVerified({ cluster: Cluster.Devnet });
        await act(settleRetries);

        expect(result.current).toEqual({ isLoading: false, tokenInfos: new Map() });
        expect(lookupVerifiedTokenInfos).not.toHaveBeenCalled();
    });

    it('should report loading on the next mount until the second lookup settles', async () => {
        const cache = await cacheWithFailedLookup();

        const { renders, result } = renderVerified({}, cache);

        await waitForHook(() => expect(result.current.tokenInfos).toEqual(VERIFIED));
        expect(renders.find(render => !render.isLoading)?.tokenInfos).toEqual(VERIFIED);
    });

    it('should resolve no token info on the next mount when the second lookup fails', async () => {
        const cache = await cacheWithFailedLookup();
        vi.mocked(lookupVerifiedTokenInfos).mockResolvedValueOnce({ kind: 'unavailable' });

        const { result } = renderVerified({}, cache);

        await waitForHook(() => expect(result.current).toEqual({ isLoading: false, tokenInfos: new Map() }));
        expect(lookupVerifiedTokenInfos).toHaveBeenCalledTimes(2);
    });

    it('should not stay loading when a mounted hook holds the failed lookup of the same mints', async () => {
        const cache = sharedCache();
        vi.mocked(lookupVerifiedTokenInfos).mockResolvedValueOnce({ kind: 'rate-limited' });
        const { result: failed } = renderVerified({}, cache);
        await waitForHook(() => expect(failed.current.isLoading).toBe(false));

        const { result } = renderVerified({}, cache);

        await waitForHook(() => expect(result.current.isLoading).toBe(false));
        expect(lookupVerifiedTokenInfos).toHaveBeenCalledOnce();
    });

    it('should report loading when the mints change to a list whose lookup failed', async () => {
        const cache = await cacheWithFailedLookup();
        const { renders, rerender, result } = renderVerified({ mints: [MINT_A] }, cache);
        await waitForHook(() => expect(result.current.isLoading).toBe(false));

        vi.mocked(lookupVerifiedTokenInfos).mockResolvedValueOnce({ kind: 'unavailable' });
        const firstRenderAfterChange = renders.length;
        rerender({ ...MAINNET, mints });

        expect(renders[firstRenderAfterChange].isLoading).toBe(true);
        await waitForHook(() => expect(result.current.isLoading).toBe(false));
    });

    function renderVerified(props: Partial<Props>, config?: SWRConfiguration) {
        const renders: ReturnType<typeof useVerifiedTokenInfos>[] = [];
        const view = renderHook(
            (hookProps: Props) => {
                const state = useVerifiedTokenInfos(hookProps);
                renders.push(state);
                return state;
            },
            { initialProps: { ...MAINNET, mints, ...props }, wrapper: swrWrapper(config) },
        );
        return { ...view, renders };
    }

    async function cacheWithFailedLookup(): Promise<SWRConfiguration> {
        const cache = sharedCache();
        vi.mocked(lookupVerifiedTokenInfos).mockResolvedValueOnce({ kind: 'rate-limited' });
        const { result, unmount } = renderVerified({}, cache);
        await waitForHook(() => expect(result.current).toEqual({ isLoading: false, tokenInfos: new Map() }));
        unmount();
        return cache;
    }
});

function renderTokenInfos(props: Partial<Props>, config?: SWRConfiguration) {
    return renderHook((hookProps: Props) => useTokenInfos(hookProps), {
        initialProps: { ...MAINNET, ...props },
        wrapper: swrWrapper(config),
    });
}

async function renderSettledThenUnmount(props: Partial<Props>, config: SWRConfiguration): Promise<void> {
    const { result, unmount } = renderTokenInfos(props, config);
    await waitForHook(() => expect(result.current.kind).not.toBe('loading'));
    unmount();
}

// One cache across mounts, so a second mount reads what the first one stored.
function sharedCache(): SWRConfiguration {
    const cache = new Map();
    return { dedupingInterval: 0, provider: () => cache };
}

function listOnly(tokens: TokenInfo[]): void {
    vi.mocked(lookupTokenInfo).mockImplementation(async ({ mint }) => {
        const token = tokens.find(entry => entry.address === mint);
        return token ? { kind: 'listed', token } : { kind: 'not-listed' };
    });
}

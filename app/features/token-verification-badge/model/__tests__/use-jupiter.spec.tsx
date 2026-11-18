import { GENESIS_HASHES, type GenesisHash } from '@entities/chain-id';
import { type TokenInfoLookup, useTokenInfo } from '@entities/token-info';
import { tokenInfo } from '@entities/token-info/__fixtures__/token-info';
import { renderHook } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gen } from '@/app/__fixtures__/gen';
import { settleRetries, swrWrapper, waitForHook } from '@/app/__tests__/swr-hook';

import { JupiterStatus, useJupiterVerification } from '../use-jupiter';

const MINT = gen.address(1);

const mocks = vi.hoisted(() => ({
    cluster: 0,
    genesisHash: undefined as GenesisHash | undefined,
    lookupTokenInfo: vi.fn(),
}));

vi.mock('@/app/providers/cluster', () => ({
    useCluster: () => ({ cluster: mocks.cluster, genesisHash: mocks.genesisHash }),
}));
vi.mock('@entities/token-info/api/lookup-token-info', () => ({ lookupTokenInfo: mocks.lookupTokenInfo }));

beforeEach(() => {
    mocks.cluster = Cluster.Mainnet;
    mocks.genesisHash = GENESIS_HASHES.MAINNET;
});

afterEach(() => {
    mocks.lookupTokenInfo.mockReset();
});

describe('useJupiterVerification', () => {
    it.each<[string, TokenInfoLookup, JupiterStatus, boolean]>([
        ['a verified token', { kind: 'listed', token: tokenInfo(MINT, true) }, JupiterStatus.Success, true],
        ['an unverified token', { kind: 'listed', token: tokenInfo(MINT, false) }, JupiterStatus.Success, false],
        ['no token', { kind: 'not-listed' }, JupiterStatus.Success, false],
        ['a rate limit', { kind: 'rate-limited' }, JupiterStatus.RateLimited, false],
        ['an unavailable lookup', { kind: 'unavailable' }, JupiterStatus.FetchFailed, false],
    ])('should map a token info lookup with %s', async (_, lookup, status, verified) => {
        mocks.lookupTokenInfo.mockResolvedValueOnce(lookup);

        const { result } = renderHook(() => useJupiterVerification(MINT), { wrapper: swrWrapper() });

        await waitForHook(() => expect(result.current).toEqual({ status, verified }));
    });

    it('should return nothing and look up nothing on a Custom cluster with the mainnet genesis hash', async () => {
        mocks.cluster = Cluster.Custom;

        const { result } = renderHook(() => useJupiterVerification(MINT), { wrapper: swrWrapper() });

        await settleRetries();
        expect(result.current).toBeUndefined();
        expect(mocks.lookupTokenInfo).not.toHaveBeenCalled();
    });

    it('should share one lookup with the token info of the mint page', async () => {
        mocks.lookupTokenInfo.mockResolvedValue({ kind: 'listed', token: tokenInfo(MINT, true) });

        const { result } = renderHook(
            () => ({
                badge: useJupiterVerification(MINT),
                page: useTokenInfo({ cluster: Cluster.Mainnet, genesisHash: GENESIS_HASHES.MAINNET, mint: MINT }),
            }),
            { wrapper: swrWrapper() },
        );

        await waitForHook(() =>
            expect(result.current.badge).toEqual({ status: JupiterStatus.Success, verified: true }),
        );
        expect(result.current.page.tokenInfo).toEqual(tokenInfo(MINT, true));
        expect(mocks.lookupTokenInfo).toHaveBeenCalledTimes(1);
    });
});

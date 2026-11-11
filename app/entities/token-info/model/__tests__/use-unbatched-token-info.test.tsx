import { GENESIS_HASHES } from '@entities/chain-id';
import { renderHook, type RenderHookResult } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { swrWrapper, waitForHook } from '@/app/__tests__/swr-hook';

import { tokenInfo } from '../../__fixtures__/token-info';
import { fetchTokenInfos } from '../../api/fetch-token-infos';
import { useUnbatchedTokenInfo } from '../use-unbatched-token-info';

vi.mock('../../api/fetch-token-infos', () => ({ fetchTokenInfos: vi.fn() }));

const mockedFetch = vi.mocked(fetchTokenInfos);

describe('useUnbatchedTokenInfo', () => {
    beforeEach(() => {
        mockedFetch.mockReset();
        mockedFetch.mockResolvedValue(new Map());
    });

    it('should return the token info of the mint', async () => {
        mockedFetch.mockResolvedValue(
            new Map([
                ['mint-a', tokenInfo('mint-a')],
                ['mint-b', tokenInfo('mint-b')],
            ]),
        );

        const { result } = renderUnbatchedTokenInfo('mint-a');

        await waitForHook(() => expect(result.current.tokenInfo).toEqual(tokenInfo('mint-a')));
        expect(mockedFetch).toHaveBeenCalledWith(['mint-a'], Cluster.Custom, GENESIS_HASHES.MAINNET);
    });

    it('should report loading until the token info arrives', async () => {
        const { result } = renderUnbatchedTokenInfo('mint-a');

        expect(result.current.isLoading).toBe(true);
        await waitForHook(() => expect(result.current.isLoading).toBe(false));
    });

    it('should return no token info when the response has no entry for the mint', async () => {
        mockedFetch.mockResolvedValue(new Map([['mint-b', tokenInfo('mint-b')]]));

        const { result } = renderUnbatchedTokenInfo('mint-a');

        await waitForHook(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.tokenInfo).toBeUndefined();
    });

    it('should not request token info without a mint', async () => {
        const { result } = renderUnbatchedTokenInfo(undefined);

        await waitForHook(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.tokenInfo).toBeUndefined();
        expect(mockedFetch).not.toHaveBeenCalled();
    });
});

function renderUnbatchedTokenInfo(
    mint: string | undefined,
): RenderHookResult<ReturnType<typeof useUnbatchedTokenInfo>, unknown> {
    return renderHook(
        () => useUnbatchedTokenInfo({ cluster: Cluster.Custom, genesisHash: GENESIS_HASHES.MAINNET, mint }),
        { wrapper: swrWrapper() },
    );
}

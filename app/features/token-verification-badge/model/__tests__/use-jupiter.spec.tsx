import { tokenInfo } from '@entities/token-info/__fixtures__/token-info';
import { renderHook } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gen } from '@/app/__fixtures__/gen';
import { settleRetries, swrWrapper, waitForHook } from '@/app/__tests__/swr-hook';

import { JupiterStatus, useJupiterVerification } from '../use-jupiter';

const MINT = gen.address(1);

const mocks = vi.hoisted(() => ({ cluster: 0 }));

vi.mock('@/app/providers/cluster', () => ({ useCluster: () => ({ cluster: mocks.cluster }) }));

const fetchMock = vi.fn();

beforeEach(() => {
    mocks.cluster = Cluster.MainnetBeta;
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
});

describe('useJupiterVerification', () => {
    it.each([
        ['a verified token', 200, { content: [tokenInfo(MINT, true)] }, JupiterStatus.Success, true],
        ['an unverified token', 200, { content: [tokenInfo(MINT, false)] }, JupiterStatus.Success, false],
        ['no token', 200, { content: [] }, JupiterStatus.Success, false],
        ['a 429', 429, { error: 'Token info rate limited' }, JupiterStatus.RateLimited, false],
        ['a 503', 503, { error: 'Token info unavailable' }, JupiterStatus.FetchFailed, false],
    ])('should map a token info response with %s', async (_, status, body, expectedStatus, verified) => {
        fetchMock.mockResolvedValueOnce(Response.json(body, { status }));

        const { result } = renderHook(() => useJupiterVerification(MINT), { wrapper: swrWrapper() });

        await waitForHook(() => expect(result.current).toEqual({ status: expectedStatus, verified }));
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(`/api/token-info/${MINT}?cluster=${Cluster.MainnetBeta}`);
        expect(init.method).toBe('GET');
    });

    it('should report a failed request as FetchFailed', async () => {
        fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

        const { result } = renderHook(() => useJupiterVerification(MINT), { wrapper: swrWrapper() });

        await waitForHook(() => expect(result.current).toEqual({ status: JupiterStatus.FetchFailed, verified: false }));
    });

    it('should send no request off mainnet', async () => {
        mocks.cluster = Cluster.Devnet;

        renderHook(() => useJupiterVerification(MINT), { wrapper: swrWrapper() });

        await settleRetries();
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

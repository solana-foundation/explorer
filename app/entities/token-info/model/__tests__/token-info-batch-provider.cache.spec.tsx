import { act, render } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getTokenInfosMock } = vi.hoisted(() => ({ getTokenInfosMock: vi.fn().mockResolvedValue([]) }));
vi.mock('@entities/token-info/lib/fetch-token-mints', () => ({ getTokenInfos: getTokenInfosMock }));

// The specs setup (test-setup.specs.ts) globally no-ops useTokenInfoBatch to prevent network. This suite
// asserts real batch behavior, so restore the actual provider for this file only.
vi.mock('@/app/entities/token-info/model/token-info-batch-provider', async () =>
    vi.importActual('@/app/entities/token-info/model/token-info-batch-provider'),
);

import { TokenInfoBatchProvider, useTokenInfoBatch } from '../token-info-batch-provider';

const MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

function Requester({ nonce }: { nonce: number }) {
    const request = useTokenInfoBatch();
    React.useEffect(() => {
        request(MINT, Cluster.MainnetBeta, 'genesis');
    }, [request, nonce]);
    return null;
}

describe('should skip already-resolved token-info requests', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    it('should fetch a mint once even when it is requested again after resolving', async () => {
        const { rerender } = render(
            <TokenInfoBatchProvider>
                <Requester nonce={0} />
            </TokenInfoBatchProvider>,
        );
        // First flush resolves MINT (getTokenInfos -> [] -> marked resolved as not-found).
        await act(async () => {
            await vi.advanceTimersByTimeAsync(200);
        });
        expect(getTokenInfosMock).toHaveBeenCalledTimes(1);

        // A later request for the same mint (re-mount / second consumer like the filter dropdown) must not re-fetch.
        rerender(
            <TokenInfoBatchProvider>
                <Requester nonce={1} />
            </TokenInfoBatchProvider>,
        );
        await act(async () => {
            await vi.advanceTimersByTimeAsync(200);
        });
        expect(getTokenInfosMock).toHaveBeenCalledTimes(1);
    });

    it('should retry a mint after a transient failure instead of caching it as resolved', async () => {
        // getTokenInfos swallows real errors and returns [] while signalling via onError. Simulate a transient
        // failure on the first flush so the batch must be left unresolved and re-fetched on the next request.
        getTokenInfosMock.mockImplementationOnce((_addresses, _cluster, _genesisHash, config) => {
            config?.onError?.(new Error('boom'));
            return Promise.resolve([]);
        });

        const { rerender } = render(
            <TokenInfoBatchProvider>
                <Requester nonce={0} />
            </TokenInfoBatchProvider>,
        );
        await act(async () => {
            await vi.advanceTimersByTimeAsync(200);
        });
        expect(getTokenInfosMock).toHaveBeenCalledTimes(1);

        // A later request for the same mint must retry - the failed batch was not marked resolved.
        rerender(
            <TokenInfoBatchProvider>
                <Requester nonce={1} />
            </TokenInfoBatchProvider>,
        );
        await act(async () => {
            await vi.advanceTimersByTimeAsync(200);
        });
        expect(getTokenInfosMock).toHaveBeenCalledTimes(2);
    });
});

function MultiNetworkRequester() {
    const request = useTokenInfoBatch();
    React.useEffect(() => {
        request(MINT, Cluster.MainnetBeta, 'genesis-main');
        request(MINT, Cluster.Devnet, 'genesis-dev');
    }, [request]);
    return null;
}

describe('should keep pending token-info requests distinct per network', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    it('should fetch the same mint for both networks requested inside one batching window', async () => {
        render(
            <TokenInfoBatchProvider>
                <MultiNetworkRequester />
            </TokenInfoBatchProvider>,
        );
        await act(async () => {
            await vi.advanceTimersByTimeAsync(200);
        });

        // One POST per network - keying `pending` by bare address would drop the mainnet request entirely.
        expect(getTokenInfosMock).toHaveBeenCalledTimes(2);
        expect(getTokenInfosMock).toHaveBeenCalledWith(
            [MINT],
            Cluster.MainnetBeta,
            'genesis-main',
            expect.objectContaining({ onError: expect.any(Function) }),
        );
        expect(getTokenInfosMock).toHaveBeenCalledWith(
            [MINT],
            Cluster.Devnet,
            'genesis-dev',
            expect.objectContaining({ onError: expect.any(Function) }),
        );
    });
});

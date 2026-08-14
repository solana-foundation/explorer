import { PublicKey } from '@solana/web3.js';
import { render, waitFor } from '@testing-library/react';
import { Cluster, clusterSelection, clusterUrl } from '@utils/cluster';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation');

const { useClusterMock } = vi.hoisted(() => ({ useClusterMock: vi.fn() }));

vi.mock('../../cluster', async importOriginal => {
    const actual = await importOriginal<typeof import('../../cluster')>();
    return { ...actual, useCluster: useClusterMock };
});

import { AccountsProvider, FetchersContext, useFetchAccountInfo } from '..';

type Captured = NonNullable<React.ContextType<typeof FetchersContext>>;

const TEST_PUBKEY = PublicKey.default;

let captured: Captured | undefined;
function Capture() {
    const ctx = React.useContext(FetchersContext) ?? undefined;
    React.useEffect(() => {
        captured = ctx;
    }, [ctx]);
    return null;
}

describe('AccountsProvider', () => {
    beforeEach(() => {
        captured = undefined;
        const selection = clusterSelection(Cluster.Devnet);
        useClusterMock.mockReturnValue({ ...selection, selection, url: clusterUrl(selection) });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should cancel pending fetcher timeouts when the provider unmounts', async () => {
        const { unmount } = render(
            <AccountsProvider>
                <Capture />
            </AccountsProvider>,
        );
        await waitFor(() => expect(captured).toBeDefined());
        if (!captured) throw new Error('Fetchers context was not captured');
        const fetchers = captured;

        const parsedCancel = vi.spyOn(fetchers.parsed, 'cancel');
        const rawCancel = vi.spyOn(fetchers.raw, 'cancel');
        const skipCancel = vi.spyOn(fetchers.skip, 'cancel');

        fetchers.parsed.fetch(TEST_PUBKEY);

        unmount();

        expect(parsedCancel).toHaveBeenCalledTimes(1);
        expect(rawCancel).toHaveBeenCalledTimes(1);
        expect(skipCancel).toHaveBeenCalledTimes(1);
    });

    it('should cancel the old fetchers when the cluster changes', async () => {
        const { rerender } = render(
            <AccountsProvider>
                <Capture />
            </AccountsProvider>,
        );
        await waitFor(() => expect(captured).toBeDefined());
        if (!captured) throw new Error('Fetchers context was not captured');
        const oldFetchers = captured;

        const parsedCancel = vi.spyOn(oldFetchers.parsed, 'cancel');
        const rawCancel = vi.spyOn(oldFetchers.raw, 'cancel');
        const skipCancel = vi.spyOn(oldFetchers.skip, 'cancel');

        oldFetchers.parsed.fetch(TEST_PUBKEY);

        useClusterMock.mockReturnValue({
            cluster: Cluster.Testnet,
            customUrl: '',
            url: clusterUrl(clusterSelection(Cluster.Testnet)),
        });
        rerender(
            <AccountsProvider>
                <Capture />
            </AccountsProvider>,
        );

        await waitFor(() => expect(captured).not.toBe(oldFetchers));

        expect(parsedCancel).toHaveBeenCalledTimes(1);
        expect(rawCancel).toHaveBeenCalledTimes(1);
        expect(skipCancel).toHaveBeenCalledTimes(1);
    });
});

describe('AccountsProvider: fetch and mount', () => {
    /**
     * Mimics a real consumer (`usePmpAccountPayload`, inspector's `AccountInfo`): fetches from a mount effect,
     * which React flushes bottom-up, so it runs BEFORE the provider's own effect and sees the fetchers of the
     * first render. It reports that set through `onFetch`, because the set the child fetched through is the
     * subject of these tests, not whichever set the provider settles on afterwards.
     */
    function FetchOnMount({ onFetch }: { onFetch: (fetchers: Captured) => void }) {
        const ctx = React.useContext(FetchersContext);
        const fetchAccount = useFetchAccountInfo();
        React.useEffect(() => {
            if (ctx) onFetch(ctx);
            fetchAccount(TEST_PUBKEY, 'skip');
        }, []); // eslint-disable-line react-hooks/exhaustive-deps -- must observe the first commit only
        return null;
    }

    beforeEach(() => {
        useClusterMock.mockReturnValue({ cluster: Cluster.Devnet, customUrl: '', url: clusterUrl(Cluster.Devnet, '') });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should cancel a first-commit fetch when the provider unmounts', async () => {
        const onFetch = vi.fn<(fetchers: Captured) => void>();
        const { unmount } = render(
            <AccountsProvider>
                <FetchOnMount onFetch={onFetch} />
            </AccountsProvider>,
        );
        await waitFor(() => expect(onFetch).toHaveBeenCalledTimes(1));
        const fetchers = onFetch.mock.calls[0][0];
        expect(fetchers.skip.fetchTimeout).toBeDefined();

        unmount();
        // unhandled "window is not defined" rejection should not occur.
        expect(fetchers.skip.fetchTimeout).toBeUndefined();
    });

    it('should not drop a first-commit fetch when React.StrictMode remounts the tree', async () => {
        const onFetch = vi.fn<(fetchers: Captured) => void>();
        render(
            <React.StrictMode>
                <AccountsProvider>
                    <FetchOnMount onFetch={onFetch} />
                </AccountsProvider>
            </React.StrictMode>,
        );
        // StrictMode mounts, tears the tree down, then mounts again, which is also what App Router dev does, so the
        // child's effect runs twice. The provider cleanup cancels the very set children fetch through, so that second
        // run has to re-arm the debounce. If it does not, a dev page would sit on "Loading" forever.
        await waitFor(() => expect(onFetch).toHaveBeenCalledTimes(2));
        const fetchers = onFetch.mock.calls[0][0];

        expect(fetchers.skip.fetchTimeout).toBeDefined();
    });
});

import { PublicKey } from '@solana/web3.js';
import { Cluster, clusterUrl } from '@utils/cluster';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation');

const { useClusterMock } = vi.hoisted(() => ({ useClusterMock: vi.fn() }));

vi.mock('../../cluster', async importOriginal => {
    const actual = await importOriginal<typeof import('../../cluster')>();
    return { ...actual, useCluster: useClusterMock };
});

import { AccountsProvider, FetchersContext } from '..';

type Captured = NonNullable<React.ContextType<typeof FetchersContext>>;

const TEST_PUBKEY = PublicKey.default;

let captured: Captured | undefined;
function Capture() {
    captured = React.useContext(FetchersContext) ?? undefined;
    return null;
}

describe('AccountsProvider', () => {
    beforeEach(() => {
        captured = undefined;
        useClusterMock.mockReturnValue({ cluster: Cluster.Devnet, customUrl: '', url: clusterUrl(Cluster.Devnet, '') });
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
        const fetchers = captured!;

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
        const oldFetchers = captured!;

        const parsedCancel = vi.spyOn(oldFetchers.parsed, 'cancel');
        const rawCancel = vi.spyOn(oldFetchers.raw, 'cancel');
        const skipCancel = vi.spyOn(oldFetchers.skip, 'cancel');

        oldFetchers.parsed.fetch(TEST_PUBKEY);

        useClusterMock.mockReturnValue({ cluster: Cluster.Testnet, customUrl: '', url: clusterUrl(Cluster.Testnet, '') });
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

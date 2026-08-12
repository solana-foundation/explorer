'use client';

import { useCluster } from '@providers/cluster';
import { Connection } from '@solana/web3.js';
import React from 'react';
import useSWRImmutable from 'swr/immutable';

import type { ConfigResolutionOnchainResult } from '../api/find-config-in-transactions';
import { findConfigInTransactions } from '../api/find-config-in-transactions';

export type ConfigResolutionOnchainState =
    | { status: 'skipped' }
    | { status: 'loading' }
    | { status: 'ready'; result: ConfigResolutionOnchainResult };

function swrKey(url: string, address: string, enabled: boolean): string | null {
    // eslint-disable-next-line unicorn/no-null -- SWR uses a null key to disable the request
    if (!enabled) return null;
    return `pmp-buffer-onchain-config-resolution:${url}:${address}`;
}

/**
 * The second config-resolution strategy: read what an on-chain instruction declared for this buffer.
 */
export function useResolveBufferConfigOnchain({
    address,
    enabled,
}: {
    address: string;
    enabled: boolean;
}): ConfigResolutionOnchainState {
    const { url } = useCluster();
    const connection = React.useMemo(() => new Connection(url), [url]);

    const { data, isLoading } = useSWRImmutable(
        swrKey(url, address, enabled),
        () => findConfigInTransactions(connection, address),
        { shouldRetryOnError: false },
    );

    if (!enabled) return { status: 'skipped' };
    if (isLoading || !data) return { status: 'loading' };
    return { result: data, status: 'ready' };
}

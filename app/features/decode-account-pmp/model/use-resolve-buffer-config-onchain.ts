'use client';

import { toErrorReason } from '@entities/pmp-account';
import { useCluster } from '@providers/cluster';
import { Connection } from '@solana/web3.js';
import React from 'react';
import useSWRImmutable from 'swr/immutable';

import type { ConfigResolutionOnchainResult } from '../api/find-config-in-transactions';
import { findConfigInTransactions } from '../api/find-config-in-transactions';

export type ConfigResolutionOnchainState =
    { status: 'skipped' } | { status: 'loading' } | { status: 'ready'; result: ConfigResolutionOnchainResult };

function swrKey(url: string, address: string, fingerprint: string, enabled: boolean): string | null {
    // eslint-disable-next-line unicorn/no-null -- SWR uses a null key to disable the request
    if (!enabled) return null;
    return `pmp-buffer-onchain-config-resolution:${url}:${address}:${fingerprint}`;
}

/**
 * The second config-resolution strategy: read what an on-chain instruction declared for this buffer.
 *
 * `fingerprint` identifies the account body the caller resolved from - see `useDecodeBufferPayload` for why the
 * result is cached against it rather than against the address alone.
 */
export function useResolveBufferConfigOnchain({
    address,
    enabled,
    fingerprint,
}: {
    address: string;
    enabled: boolean;
    fingerprint: string;
}): ConfigResolutionOnchainState {
    const { url } = useCluster();
    const connection = React.useMemo(() => new Connection(url), [url]);

    const { data, error, isLoading } = useSWRImmutable(
        swrKey(url, address, fingerprint, enabled),
        () => findConfigInTransactions(connection, address),
        { shouldRetryOnError: false },
    );

    if (!enabled) return { status: 'skipped' };

    // `findConfigInTransactions` returns its failures rather than throwing, so nothing reaches this today. It is read
    // anyway because `shouldRetryOnError: false` leaves a rejected fetcher with `isLoading` false and no `data`, which
    // the check below would report as `loading` forever. Mapped onto the union's own `failed` arm, so the card reuses
    // the note it already renders for a dead scan.
    if (error) {
        return { result: { kind: 'failed', reason: toErrorReason(error, 'unknown lookup error') }, status: 'ready' };
    }

    if (isLoading || !data) return { status: 'loading' };
    return { result: data, status: 'ready' };
}

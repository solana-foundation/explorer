'use client';

import type { Account, FetchAccountDataMode } from '@providers/accounts';
import { FetchersContext, StateContext } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import React from 'react';

type UseAccountQueryOptions<TData> = {
    select: (account: Account) => TData | undefined;
    dataMode?: FetchAccountDataMode;
};

type UseAccountQueryResult<TData> = {
    data: TData | undefined;
    isLoading: boolean;
    isError: boolean;
};

// Thin wrapper over AccountsProvider with a react-query-like API.
// key[0] is always the account address. key = undefined disables the query.
// When migrating to @tanstack/react-query, replace the body with useQuery().
export function useAccountQuery<TData>(
    key: readonly [address: string, ...unknown[]] | undefined,
    options: UseAccountQueryOptions<TData>,
): UseAccountQueryResult<TData> {
    const state = React.useContext(StateContext);
    const fetchers = React.useContext(FetchersContext);

    if (!state || !fetchers) {
        throw new Error('useAccountQuery must be used within an AccountsProvider');
    }

    const address = key?.[0];
    const dataMode = options.dataMode ?? 'parsed';
    const { select } = options;

    const cacheEntry = address ? state.entries[address] : undefined;

    React.useEffect(() => {
        if (!address) return;
        if (cacheEntry) return;
        fetchers[dataMode].fetch(new PublicKey(address));
    }, [address, cacheEntry, dataMode, fetchers]);

    const data = React.useMemo(() => {
        if (!cacheEntry?.data) return undefined;
        return select(cacheEntry.data);
    }, [cacheEntry?.data, select]);

    if (!key) {
        return { data: undefined, isError: false, isLoading: false };
    }

    return {
        data,
        isError: cacheEntry?.status === FetchStatus.FetchFailed,
        isLoading: !cacheEntry || cacheEntry.status === FetchStatus.Fetching,
    };
}

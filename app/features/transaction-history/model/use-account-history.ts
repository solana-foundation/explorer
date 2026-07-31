'use client';

import * as Cache from '@providers/cache';
import { ActionType } from '@providers/cache';
import { useCluster } from '@providers/cluster';
import React from 'react';

import type { AccountHistory } from '../lib/types';
import {
    DispatchContext,
    GenerationContext,
    InFlightContext,
    MethodSupportContext,
    StateContext,
} from './history-provider';

export function useAccountHistories() {
    const context = React.useContext(StateContext);

    if (!context) {
        throw new Error(`useAccountHistories must be used within a AccountsProvider`);
    }

    return context.entries;
}

export function useAccountHistory(address: string): Cache.CacheEntry<AccountHistory> | undefined {
    const context = React.useContext(StateContext);

    if (!context) {
        throw new Error(`useAccountHistory must be used within a AccountsProvider`);
    }

    return context.entries[address];
}

// Whether the current endpoint supports getTransactionsForAddress, and therefore
// filtering. Defaults to true outside a HistoryProvider (e.g. isolated component tests).
export function useHistoryFiltersSupported(): boolean {
    return React.useContext(MethodSupportContext)?.supported ?? true;
}

/**
 * Resets a single address's history so the next fetch starts from a clean slate.
 * Bumps the address generation (so any in-flight request for it is discarded) and
 * evicts its in-flight marker (so the immediately-following refetch isn't deduped),
 * then clears only that address's cache entry.
 */
export function useResetAccountHistory() {
    const { url } = useCluster();
    const dispatch = React.useContext(DispatchContext);
    const inFlight = React.useContext(InFlightContext);
    const generations = React.useContext(GenerationContext);
    if (!dispatch || !inFlight || !generations) {
        throw new Error(`useResetAccountHistory must be used within a HistoryProvider`);
    }
    return React.useCallback(
        (address: string) => {
            generations.set(address, (generations.get(address) ?? 0) + 1);
            inFlight.delete(address);
            dispatch({ key: address, type: ActionType.Clear, url });
        },
        [dispatch, inFlight, generations, url],
    );
}

import type { AccountHistory, MethodSupport } from '@providers/accounts/history';
import {
    DispatchContext,
    GenerationContext,
    InFlightContext,
    MethodSupportContext,
    StateContext,
} from '@providers/accounts/history';
import type { CacheEntry } from '@providers/cache';
import { MAINNET_BETA_URL } from '@utils/cluster';
import type { ReactNode } from 'react';

type Props = {
    children: ReactNode;
    /** Seeded account-history cache, keyed by base58 address. */
    history?: Record<string, CacheEntry<AccountHistory>>;
    /** Pre-populated set of in-flight addresses (defaults to empty). */
    inFlight?: Set<string>;
    /** Whether the endpoint supports `getTransactionsForAddress` (drives filter availability). */
    filtersSupported?: boolean;
};

/**
 * Mock HistoryProvider for Storybook. Accepts seeded history entries so consumers of
 * `useAccountHistory` / `useAccountHistories` / `useFetchAccountHistory` find data without
 * hitting the RPC. Defaults to an empty cache.
 */
const EMPTY_IN_FLIGHT = new Set<string>();
const EMPTY_GENERATIONS = new Map<string, number>();
const SUPPORTED: MethodSupport = { markUnsupported: () => {}, supported: true };
const UNSUPPORTED: MethodSupport = { markUnsupported: () => {}, supported: false };

export function MockHistoryProvider({
    children,
    history = {},
    inFlight = EMPTY_IN_FLIGHT,
    filtersSupported = true,
}: Props) {
    return (
        <StateContext.Provider value={{ entries: history, url: MAINNET_BETA_URL }}>
            <DispatchContext.Provider value={() => {}}>
                <InFlightContext.Provider value={inFlight}>
                    <GenerationContext.Provider value={EMPTY_GENERATIONS}>
                        <MethodSupportContext.Provider value={filtersSupported ? SUPPORTED : UNSUPPORTED}>
                            {children}
                        </MethodSupportContext.Provider>
                    </GenerationContext.Provider>
                </InFlightContext.Provider>
            </DispatchContext.Provider>
        </StateContext.Provider>
    );
}

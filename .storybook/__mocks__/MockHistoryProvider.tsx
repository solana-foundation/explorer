import type { AccountHistory } from '@providers/accounts/history';
import { DispatchContext, InFlightContext, StateContext } from '@providers/accounts/history';
import type { CacheEntry } from '@providers/cache';
import { MAINNET_BETA_URL } from '@utils/cluster';
import type { ReactNode } from 'react';

type Props = {
    children: ReactNode;
    /** Seeded account-history cache, keyed by base58 address. */
    history?: Record<string, CacheEntry<AccountHistory>>;
    /** Pre-populated set of in-flight addresses (defaults to empty). */
    inFlight?: Set<string>;
};

/**
 * Mock HistoryProvider for Storybook. Accepts seeded history entries so consumers of
 * `useAccountHistory` / `useAccountHistories` / `useFetchAccountHistory` find data without
 * hitting the RPC. Defaults to an empty cache.
 */
export function MockHistoryProvider({ children, history = {}, inFlight = new Set<string>() }: Props) {
    return (
        <StateContext.Provider value={{ entries: history, url: MAINNET_BETA_URL }}>
            <DispatchContext.Provider value={() => {}}>
                <InFlightContext.Provider value={inFlight}>{children}</InFlightContext.Provider>
            </DispatchContext.Provider>
        </StateContext.Provider>
    );
}

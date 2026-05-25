import type { CacheEntry } from '@providers/cache';
import { DispatchContext, StateContext, type TransactionStatus } from '@providers/transactions';
import {
    DispatchContext as ParsedDispatchContext,
    type Details as ParsedDetails,
    StateContext as ParsedStateContext,
} from '@providers/transactions/parsed';
import {
    DispatchContext as RawDispatchContext,
    type Details as RawDetails,
    StateContext as RawStateContext,
} from '@providers/transactions/raw';
import { MAINNET_BETA_URL } from '@utils/cluster';
import type { ReactNode } from 'react';

type SeededEntries<T> = Record<string, CacheEntry<T>>;

type Props = {
    children: ReactNode;
    /** Seeded transaction status cache, keyed by signature. */
    status?: SeededEntries<TransactionStatus>;
    /** Seeded parsed-details cache, keyed by signature. */
    parsed?: SeededEntries<ParsedDetails>;
    /** Seeded raw-details cache, keyed by signature. */
    raw?: SeededEntries<RawDetails>;
};

/**
 * Mock TransactionsProvider for Storybook. Accepts seeded entries for status, parsed, and raw
 * caches so consumers of `useTransactionStatus` / `useTransactionDetails` / `useRawTransactionDetails`
 * find the data they need without firing RPC calls. Defaults to empty caches.
 */
export function MockTransactionsProvider({ children, status = {}, parsed = {}, raw = {} }: Props) {
    return (
        <StateContext.Provider value={{ entries: status, url: MAINNET_BETA_URL }}>
            <DispatchContext.Provider value={() => {}}>
                <RawStateContext.Provider value={{ entries: raw, url: MAINNET_BETA_URL }}>
                    <RawDispatchContext.Provider value={() => {}}>
                        <ParsedStateContext.Provider value={{ entries: parsed, url: MAINNET_BETA_URL }}>
                            <ParsedDispatchContext.Provider value={() => {}}>
                                {children}
                            </ParsedDispatchContext.Provider>
                        </ParsedStateContext.Provider>
                    </RawDispatchContext.Provider>
                </RawStateContext.Provider>
            </DispatchContext.Provider>
        </StateContext.Provider>
    );
}

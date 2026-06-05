import { DispatchContext, FetchersContext, type State, StateContext } from '@providers/accounts';
import { ScrollAnchorProvider } from '@providers/scroll-anchor';
import { TransactionsProvider } from '@providers/transactions';
import type { Decorator, Parameters } from '@storybook/react';
import React, { useLayoutEffect, useRef } from 'react';
import { fn } from 'storybook/test';

import { MockAccountsProvider } from './__mocks__/MockAccountsProvider';
import { MockClusterProvider as ClusterProvider } from './__mocks__/MockClusterProvider';
import { MockHistoryProvider } from './__mocks__/MockHistoryProvider';
import { MockStatsProvider } from './__mocks__/MockStatsProvider';
import { MockSupplyProvider } from './__mocks__/MockSupplyProvider';
import { MockTokenInfoBatchProvider } from './__mocks__/MockTokenInfoBatchProvider';
import { MockTransactionsProvider } from './__mocks__/MockTransactionsProvider';

const noopFetcher = async () => undefined;
// MultipleAccountFetcher has private constructor params (nominal-typed) — no structural object matches.
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- decorator-only stub
const noopAccountsFetchers = {
    parsed: { fetch: noopFetcher },
    raw: { fetch: noopFetcher },
    skip: { fetch: noopFetcher },
} as unknown as React.ContextType<typeof FetchersContext>;

/** Wraps stories with ClusterProvider. Usage: `decorators: [withCluster]` */
export const withCluster: Decorator = Story => (
    <ClusterProvider>
        <Story />
    </ClusterProvider>
);

/** Wraps stories with the real ScrollAnchorProvider. Usage: `decorators: [withScrollAnchor]` */
export const withScrollAnchor: Decorator = Story => (
    <ScrollAnchorProvider>
        <Story />
    </ScrollAnchorProvider>
);

/** Wraps stories with ClusterProvider and MockAccountsProvider. Usage: `decorators: [withClusterAndAccounts]` */
export const withClusterAndAccounts: Decorator = Story => (
    <ClusterProvider>
        <MockAccountsProvider>
            <Story />
        </MockAccountsProvider>
    </ClusterProvider>
);

/**
 * Factory: seeds the real accounts contexts with a fixture `State` so consumers of `useAccountInfo`
 * etc. resolve against the provided cache. Fetchers no-op (no RPC calls).
 * Usage: `decorators: [withAccountsState(stateWithFixture)]`
 */
export function withAccountsState(state: State): Decorator {
    return function WithAccountsState(Story) {
        return (
            <ClusterProvider>
                <StateContext.Provider value={state}>
                    <DispatchContext.Provider value={() => undefined}>
                        <FetchersContext.Provider value={noopAccountsFetchers}>
                            <Story />
                        </FetchersContext.Provider>
                    </DispatchContext.Provider>
                </StateContext.Provider>
            </ClusterProvider>
        );
    };
}

/** Decorator for card table field components. Usage: `decorators: [withCardTableField]` */
export const withCardTableField: Decorator = Story => (
    <ClusterProvider>
        <MockAccountsProvider>
            <div className="card">
                <div className="table-responsive mb-0">
                    <style>{`.card-table tbody tr:first-child td { border-top: none !important; }`}</style>
                    <table className="table table-sm table-nowrap card-table">
                        <tbody>
                            <Story />
                        </tbody>
                    </table>
                </div>
            </div>
        </MockAccountsProvider>
    </ClusterProvider>
);

/** Wraps stories with ClusterProvider, TransactionsProvider, and MockAccountsProvider. Usage: `decorators: [withTransactions]` */
export const withTransactions: Decorator = Story => (
    <ClusterProvider>
        <TransactionsProvider>
            <MockAccountsProvider>
                <Story />
            </MockAccountsProvider>
        </TransactionsProvider>
    </ClusterProvider>
);

/** Wraps stories with MockTokenInfoBatchProvider. Usage: `decorators: [withTokenInfoBatch]` */
export const withTokenInfoBatch: Decorator = Story => (
    <MockTokenInfoBatchProvider>
        <Story />
    </MockTokenInfoBatchProvider>
);

/** Wraps stories with ClusterProvider and MockSupplyProvider. Usage: `decorators: [withSupply]` */
export const withSupply: Decorator = Story => (
    <ClusterProvider>
        <MockSupplyProvider>
            <Story />
        </MockSupplyProvider>
    </ClusterProvider>
);

/** Wraps stories with ClusterProvider and MockStatsProvider. Usage: `decorators: [withStats]` */
export const withStats: Decorator = Story => (
    <ClusterProvider>
        <MockStatsProvider>
            <Story />
        </MockStatsProvider>
    </ClusterProvider>
);

/**
 * Wraps stories with ClusterProvider, MockTransactionsProvider, and MockAccountsProvider.
 * Replaces the production TransactionsProvider so consumers don't fire RPC calls.
 * Usage: `decorators: [withMockTransactions]`
 */
export const withMockTransactions: Decorator = Story => (
    <ClusterProvider>
        <MockTransactionsProvider>
            <MockAccountsProvider>
                <Story />
            </MockAccountsProvider>
        </MockTransactionsProvider>
    </ClusterProvider>
);

/**
 * Wraps stories with ClusterProvider, MockAccountsProvider, and MockHistoryProvider.
 * Provides empty history cache for components consuming `useAccountHistory` and friends.
 * Usage: `decorators: [withHistory]`
 */
export const withHistory: Decorator = Story => (
    <ClusterProvider>
        <MockAccountsProvider>
            <MockHistoryProvider>
                <Story />
            </MockHistoryProvider>
        </MockAccountsProvider>
    </ClusterProvider>
);

type NextjsNavigationOptions = {
    pathname?: string;
    query?: Record<string, string>;
};

/** Creates parameters for components using Next.js navigation */
export const createNextjsParameters = (options?: NextjsNavigationOptions): Parameters => ({
    nextjs: {
        appDirectory: true,
        navigation: {
            pathname: options?.pathname ?? '/',
            query: options?.query ?? {},
        },
    },
});

export const nextjsParameters: Parameters = createNextjsParameters();

/** Mocks navigator.clipboard.writeText for stories that copy text. Usage: `decorators: [withClipboardMock]` */
export const withClipboardMock: Decorator = Story => {
    Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: fn().mockResolvedValue(undefined) },
    });

    return <Story />;
};

/** Errored variant — writeText rejects so consumers flip to 'errored' state. */
export const withClipboardMockErrored: Decorator = Story => {
    Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: fn().mockRejectedValue(new Error('mock clipboard write failed')) },
    });

    return <Story />;
};

// Cancels the load and pins `complete` to false on the first <img> it wraps, so
// it stays in its pending state. Scoped to that one element — no global patching,
// so it's safe in the combined Docs view where stories share a page.
function ImageLoadPendingBoundary({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const img = ref.current?.querySelector('img');
        if (!img) return;
        Object.defineProperty(img, 'complete', { configurable: true, get: () => false });
        img.removeAttribute('src');
    }, []);

    return <div ref={ref}>{children}</div>;
}

/**
 * Holds the story's first <img> in its pending state so a loading placeholder or
 * skeleton is the visible, documentable state — without it a bundled image
 * resolves instantly and the placeholder is gone before it can be seen.
 * Usage: `decorators: [withImageLoadPending]`
 */
export const withImageLoadPending: Decorator = Story => (
    <ImageLoadPendingBoundary>
        <Story />
    </ImageLoadPendingBoundary>
);

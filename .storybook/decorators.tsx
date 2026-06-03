import { Description, Stories, Title } from '@storybook/addon-docs/blocks';
import { ScrollAnchorProvider } from '@providers/scroll-anchor';
import { TransactionsProvider } from '@providers/transactions';
import { Connection } from '@solana/web3.js';
import type { Decorator, Parameters } from '@storybook/react';
import React from 'react';
import { fn } from 'storybook/test';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';

import { MockAccountsProvider } from './__mocks__/MockAccountsProvider';
import { MockClusterProvider as ClusterProvider } from './__mocks__/MockClusterProvider';
import { MockHistoryProvider } from './__mocks__/MockHistoryProvider';
import { MockStatsProvider } from './__mocks__/MockStatsProvider';
import { MockSupplyProvider } from './__mocks__/MockSupplyProvider';
import { MockTokenInfoBatchProvider } from './__mocks__/MockTokenInfoBatchProvider';
import { MockTransactionsProvider } from './__mocks__/MockTransactionsProvider';

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

// Patch Connection prototype methods at module load so stories don't hit real RPC. Returning
// null/zero matches "transaction not found" semantics which consumers treat as the empty path.
const connectionProto = Connection.prototype as unknown as Record<string, unknown>;
const stubbedNull = async () => null;
const stubbedNumber = async () => 0;
const stubbedArray = async () => [];
const rpcMethodStubs: Record<string, unknown> = {
    getParsedTransaction: stubbedNull,
    getTransaction: stubbedNull,
    getSignaturesForAddress: stubbedArray,
    getAccountInfo: stubbedNull,
    getParsedAccountInfo: stubbedNull,
    getMultipleAccountsInfo: stubbedArray,
    getParsedTokenAccountsByOwner: stubbedArray,
    getBalance: stubbedNumber,
    getBlockHeight: stubbedNumber,
    getSlot: stubbedNumber,
};
for (const [method, stub] of Object.entries(rpcMethodStubs)) {
    connectionProto[`__original_${method}`] = connectionProto[method];
}

/**
 * Stubs `@solana/web3.js` Connection RPC methods on prototype so stories that render
 * TransactionHistoryCard / etc. don't hit a real Solana RPC. Activates on first story render
 * and stays active for the session.
 */
export const withMockRpc: Decorator = Story => {
    for (const [method, stub] of Object.entries(rpcMethodStubs)) {
        connectionProto[method] = stub;
    }
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

/**
 * Autodocs page renderer that omits the Primary preview block, so the first variant in the
 * Stories section isn't duplicated at the top. Use as `parameters.docs.page = responsiveDocsPage`.
 */
export const responsiveDocsPage = () => (
    <>
        <Title />
        <Description />
        <Stories />
    </>
);

/**
 * Reads the viewport global (set via `globals: { viewport: { value: 'iphonex' } }`) and constrains
 * the story width to that viewport's dimensions. Width-only — the Storybook viewport addon already
 * sizes the canvas iframe (height + width, device emulation); this decorator complements it by
 * applying the same width in docs (where the addon doesn't size). Height stays natural.
 */
export const withViewportFromGlobal: Decorator = (Story, context) => {
    const viewport = context.globals.viewport;
    const key = typeof viewport === 'object' ? viewport?.value : viewport;
    const isRotated = typeof viewport === 'object' ? viewport?.isRotated : false;
    const def = key
        ? (INITIAL_VIEWPORTS as Record<string, { styles: { width: string; height: string } }>)[key]
        : undefined;
    if (!def) return <Story />;
    const width = isRotated ? def.styles.height : def.styles.width;
    return (
        <div style={{ margin: '0 auto', width }}>
            <Story />
        </div>
    );
};

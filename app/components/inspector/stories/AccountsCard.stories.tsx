import { DispatchContext, FetchersContext, State, StateContext } from '@providers/accounts';
import { ClusterProvider } from '@providers/cluster';
import { MessageV0, PublicKey, VersionedMessage } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { expect, within } from 'storybook/test';

import { FetchStatus } from '@/app/providers/cache';
import { MAINNET_BETA_URL } from '@/app/utils/cluster';

import { nextjsParameters } from '../../../../.storybook/decorators';
import { AccountsCard } from '../AccountsCard';

// Create a message with address table lookups to trigger loading state
const createMessageWithLookups = (): VersionedMessage => {
    const lookupTableKey = new PublicKey('AddressLookupTab1e1111111111111111111111111');

    return {
        addressTableLookups: [
            {
                accountKey: lookupTableKey,
                readonlyIndexes: [2],
                writableIndexes: [0, 1],
            },
        ],
        compiledInstructions: [],
        getAccountKeys: () => ({
            accountKeysFromLookups: undefined,
            staticAccountKeys: [
                new PublicKey('11111111111111111111111111111111'),
                new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            ],
        }),
        header: {
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
            numRequiredSignatures: 1,
        },
        recentBlockhash: '4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZAMdL4VZHirm',
        staticAccountKeys: [
            new PublicKey('11111111111111111111111111111111'), // Fee payer
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // Token program
        ],
        version: 0,
    } as unknown as MessageV0;
};

// Create a message without lookups (loads immediately)
const createMessageWithoutLookups = (): VersionedMessage => {
    return {
        addressTableLookups: [],
        compiledInstructions: [],
        getAccountKeys: () => ({
            accountKeysFromLookups: undefined,
            staticAccountKeys: [
                new PublicKey('11111111111111111111111111111111'),
                new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            ],
        }),
        header: {
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
            numRequiredSignatures: 1,
        },
        recentBlockhash: '4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZAMdL4VZHirm',
        staticAccountKeys: [
            new PublicKey('11111111111111111111111111111111'),
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        ],
        version: 0,
    } as unknown as MessageV0;
};

// No-op function for mock fetchers
const noop = () => {
    // intentionally empty
};

// Mock provider that simulates loading state (no entries = loading)
function MockAccountsProviderLoading({ children }: { children: React.ReactNode }) {
    const mockState: State = {
        entries: {}, // Empty entries = lookup tables not loaded yet
        url: MAINNET_BETA_URL,
    };

    const mockFetchers = {
        parsed: { fetch: noop },
        raw: { fetch: noop },
        skip: { fetch: noop },
    };

    return (
        <StateContext.Provider value={mockState}>
            <DispatchContext.Provider value={noop}>
                <FetchersContext.Provider value={mockFetchers as any}>{children}</FetchersContext.Provider>
            </DispatchContext.Provider>
        </StateContext.Provider>
    );
}

// Mock provider with loaded accounts
function MockAccountsProviderLoaded({ children }: { children: React.ReactNode }) {
    const mockState: State = {
        entries: {
            '11111111111111111111111111111111': {
                data: {
                    data: {},
                    executable: false,
                    lamports: 1_000_000_000,
                    owner: new PublicKey('11111111111111111111111111111111'),
                    pubkey: new PublicKey('11111111111111111111111111111111'),
                    space: 0,
                },
                status: FetchStatus.Fetched,
            },
            TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: {
                data: {
                    data: {},
                    executable: true,
                    lamports: 5_000_000_000,
                    owner: new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111'),
                    pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                    space: 36,
                },
                status: FetchStatus.Fetched,
            },
        },
        url: MAINNET_BETA_URL,
    };

    const mockFetchers = {
        parsed: { fetch: noop },
        raw: { fetch: noop },
        skip: { fetch: noop },
    };

    return (
        <StateContext.Provider value={mockState}>
            <DispatchContext.Provider value={noop}>
                <FetchersContext.Provider value={mockFetchers as any}>{children}</FetchersContext.Provider>
            </DispatchContext.Provider>
        </StateContext.Provider>
    );
}

const meta = {
    component: AccountsCard,
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/Inspector/AccountsCard',
} satisfies Meta<typeof AccountsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoadingLookupTables: Story = {
    args: {
        message: createMessageWithLookups(),
    },
    decorators: [
        Story => (
            <ClusterProvider>
                <MockAccountsProviderLoading>
                    <Story />
                </MockAccountsProviderLoading>
            </ClusterProvider>
        ),
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Should show "Loading accounts..." message
        await expect(canvas.getByText('Loading accounts...')).toBeInTheDocument();

        // Should show the card header
        await expect(canvas.getByText(/Account List/)).toBeInTheDocument();
    },
};

export const LoadedWithoutLookups: Story = {
    args: {
        message: createMessageWithoutLookups(),
    },
    decorators: [
        Story => (
            <ClusterProvider>
                <MockAccountsProviderLoaded>
                    <Story />
                </MockAccountsProviderLoaded>
            </ClusterProvider>
        ),
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Should NOT show loading message
        const loadingMessage = canvas.queryByText('Loading accounts...');
        await expect(loadingMessage).not.toBeInTheDocument();

        // Should show account rows
        await expect(canvas.getByText('Account #1')).toBeInTheDocument();
        await expect(canvas.getByText('Account #2')).toBeInTheDocument();
    },
};

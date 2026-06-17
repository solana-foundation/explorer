import { DispatchContext, FetchersContext, type State, StateContext } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import { AddressLookupTableProgram, PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { mockVersionedMessage } from '@storybook-config/__fixtures__/messages';
import { MockClusterProvider as ClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';
import { nextjsParameters, withTokenInfoBatch } from '@storybook-config/decorators';
import React from 'react';

import { MAINNET_BETA_URL } from '@/app/utils/cluster';

import { AddressTableLookupsCard } from '../AddressTableLookupsCard';

const LOOKUP_TABLE_KEY = new PublicKey('AddressLookupTab1e1111111111111111111111111');
const RESOLVED_A = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const RESOLVED_B = new PublicKey('So11111111111111111111111111111111111111112');

const noop = () => undefined;

const createAccountsState = (entries: State['entries']): State => ({
    entries,
    url: MAINNET_BETA_URL,
});

function MockProvider({ children, state }: { children: React.ReactNode; state: State }) {
    return (
        <ClusterProvider>
            <StateContext.Provider value={state}>
                <DispatchContext.Provider value={noop}>
                    <FetchersContext.Provider
                        value={{ parsed: { fetch: noop }, raw: { fetch: noop }, skip: { fetch: noop } } as any}
                    >
                        {children}
                    </FetchersContext.Provider>
                </DispatchContext.Provider>
            </StateContext.Provider>
        </ClusterProvider>
    );
}

const messageWithLookups = mockVersionedMessage({
    addressTableLookups: [
        {
            accountKey: LOOKUP_TABLE_KEY,
            readonlyIndexes: [1],
            writableIndexes: [0],
        },
    ],
    header: {
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
        numRequiredSignatures: 0,
    },
    staticAccountKeys: [],
});

const resolvedState = createAccountsState({
    [LOOKUP_TABLE_KEY.toBase58()]: {
        data: {
            data: {
                parsed: {
                    parsed: {
                        info: {
                            addresses: [RESOLVED_A, RESOLVED_B],
                            authority: undefined,
                            deactivationSlot: '18446744073709551615',
                            lastExtendedSlot: '0',
                            lastExtendedSlotStartIndex: 0,
                        },
                        type: 'lookupTable',
                    },
                    program: 'address-lookup-table',
                    space: 568,
                },
            } as any,
            executable: false,
            lamports: 1_000_000_000,
            owner: AddressLookupTableProgram.programId,
            pubkey: LOOKUP_TABLE_KEY,
            space: 568,
        },
        status: FetchStatus.Fetched,
    },
});

const meta = {
    component: AddressTableLookupsCard,
    decorators: [withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Inspector/AddressTableLookupsCard',
} satisfies Meta<typeof AddressTableLookupsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithResolvedAddresses: Story = {
    args: { message: messageWithLookups },
    decorators: [
        Story => (
            <MockProvider state={resolvedState}>
                <Story />
            </MockProvider>
        ),
    ],
};

const messageNoLookups = mockVersionedMessage({
    ...messageWithLookups,
    addressTableLookups: [],
});

export const Empty: Story = {
    args: { message: messageNoLookups },
    decorators: [
        Story => (
            <MockProvider state={createAccountsState({})}>
                <Story />
            </MockProvider>
        ),
    ],
};

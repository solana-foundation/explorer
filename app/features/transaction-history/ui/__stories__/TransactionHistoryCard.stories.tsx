import type { Meta, StoryObj } from '@storybook/react';

import { ClusterProvider } from '@providers/cluster';
import { mockAccountHistory, mockConfirmedSignatureInfo } from '@storybook-config/__fixtures__/account-history';
import { MockAccountsProvider } from '@storybook-config/__mocks__/MockAccountsProvider';
import { MockHistoryProvider } from '@storybook-config/__mocks__/MockHistoryProvider';
import { MockTransactionsProvider } from '@storybook-config/__mocks__/MockTransactionsProvider';
import { nextjsParameters } from '@storybook-config/decorators';

import { TransactionHistoryCard } from '../TransactionHistoryCard';

const ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

const meta: Meta<typeof TransactionHistoryCard> = {
    component: TransactionHistoryCard,
    parameters: nextjsParameters,
    title: 'Features/TransactionHistory/TransactionHistoryCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyHistory: Story = {
    args: { address: ADDRESS },
    decorators: [
        Story => (
            <ClusterProvider>
                <MockAccountsProvider>
                    <MockTransactionsProvider>
                        <MockHistoryProvider
                            history={{ [ADDRESS]: mockAccountHistory({ fetched: [], foundOldest: true }) }}
                        >
                            <Story />
                        </MockHistoryProvider>
                    </MockTransactionsProvider>
                </MockAccountsProvider>
            </ClusterProvider>
        ),
    ],
};

export const WithSignatures: Story = {
    args: { address: ADDRESS },
    decorators: [
        Story => (
            <ClusterProvider>
                <MockAccountsProvider>
                    <MockTransactionsProvider>
                        <MockHistoryProvider
                            history={{
                                [ADDRESS]: mockAccountHistory({
                                    fetched: [
                                        mockConfirmedSignatureInfo({ blockTime: null, slot: 312_456_789 }),
                                        mockConfirmedSignatureInfo({
                                            blockTime: null,
                                            err: { InstructionError: [0, 'Custom'] },
                                            slot: 312_456_790,
                                        }),
                                        mockConfirmedSignatureInfo({ blockTime: null, slot: 312_456_791 }),
                                    ],
                                    foundOldest: false,
                                }),
                            }}
                        >
                            <Story />
                        </MockHistoryProvider>
                    </MockTransactionsProvider>
                </MockAccountsProvider>
            </ClusterProvider>
        ),
    ],
};

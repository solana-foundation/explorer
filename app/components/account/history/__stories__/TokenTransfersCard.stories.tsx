import type { Meta, StoryObj } from '@storybook/react';
import { mockAccountHistory, mockConfirmedSignatureInfo } from '@storybook-config/__fixtures__/account-history';
import { MockAccountsProvider } from '@storybook-config/__mocks__/MockAccountsProvider';
import { MockClusterProvider as ClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';
import { MockHistoryProvider } from '@storybook-config/__mocks__/MockHistoryProvider';
import { nextjsParameters } from '@storybook-config/decorators';

import { TokenTransfersCard } from '../TokenTransfersCard';

const ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

const meta: Meta<typeof TokenTransfersCard> = {
    component: TokenTransfersCard,
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Account/History/TokenTransfersCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyHistory: Story = {
    args: { address: ADDRESS },
    decorators: [
        Story => (
            <ClusterProvider>
                <MockAccountsProvider>
                    <MockHistoryProvider
                        history={{ [ADDRESS]: mockAccountHistory({ fetched: [], foundOldest: true }) }}
                    >
                        <Story />
                    </MockHistoryProvider>
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
                    <MockHistoryProvider
                        history={{
                            [ADDRESS]: mockAccountHistory({
                                fetched: [
                                    mockConfirmedSignatureInfo({ blockTime: null, slot: 312_456_789 }),
                                    mockConfirmedSignatureInfo({ blockTime: null, slot: 312_456_790 }),
                                ],
                                foundOldest: false,
                            }),
                        }}
                    >
                        <Story />
                    </MockHistoryProvider>
                </MockAccountsProvider>
            </ClusterProvider>
        ),
    ],
};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { mockAccountHistory, mockConfirmedSignatureInfo } from '@storybook-config/__fixtures__/account-history';
import { MockAccountsProvider } from '@storybook-config/__mocks__/MockAccountsProvider';
import { MockClusterProvider as ClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';
import { MockHistoryProvider } from '@storybook-config/__mocks__/MockHistoryProvider';
import { MockTransactionsProvider } from '@storybook-config/__mocks__/MockTransactionsProvider';
import { nextjsParameters } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withMockRpc, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { TransactionHistoryCard } from '../TransactionHistoryCard';

const ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

// Stable signatures keep SWR / transaction-queue caches bounded across story switches.
const SIGNATURES = {
    first: '2JgaFstableSignaturePlaceholderForMobileTabletSwitch1ZBbGU',
    second: '5YtADstableSignaturePlaceholderForMobileTabletSwitch2LJatM',
    third: 'dbaW9stableSignaturePlaceholderForMobileTabletSwitch3fa3ew',
};

const meta: Meta<typeof TransactionHistoryCard> = {
    component: TransactionHistoryCard,
    decorators: [withMockRpc, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
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
                                        mockConfirmedSignatureInfo({
                                            blockTime: null,
                                            signature: SIGNATURES.first,
                                            slot: 312_456_789,
                                        }),
                                        mockConfirmedSignatureInfo({
                                            blockTime: null,
                                            err: { InstructionError: [0, 'Custom'] },
                                            signature: SIGNATURES.second,
                                            slot: 312_456_790,
                                        }),
                                        mockConfirmedSignatureInfo({
                                            blockTime: null,
                                            signature: SIGNATURES.third,
                                            slot: 312_456_791,
                                        }),
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

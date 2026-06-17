import type { Meta, StoryObj } from '@storybook/react';
import { mockAccountHistory, mockConfirmedSignatureInfo } from '@storybook-config/__fixtures__/account-history';
import { MockAccountsProvider } from '@storybook-config/__mocks__/MockAccountsProvider';
import { MockClusterProvider as ClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';
import { MockHistoryProvider } from '@storybook-config/__mocks__/MockHistoryProvider';
import { MockTransactionsProvider } from '@storybook-config/__mocks__/MockTransactionsProvider';
import { nextjsParameters } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withMockRpc, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { TransactionHistoryCard } from '../TransactionHistoryCard';

const ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

// Stable signatures so SWR/transaction-queue caches hit across story switches (Mobile ↔ Tablet).
// Random signatures would leak entries into both caches on every remount.
const HISTORY = {
    [ADDRESS]: mockAccountHistory({
        fetched: [
            mockConfirmedSignatureInfo({
                blockTime: null,
                signature: '2JgaFstableSignaturePlaceholderForMobileTabletSwitch1ZBbGU',
                slot: 312_456_789,
            }),
            mockConfirmedSignatureInfo({
                blockTime: null,
                err: { InstructionError: [0, 'Custom'] },
                signature: '5YtADstableSignaturePlaceholderForMobileTabletSwitch2LJatM',
                slot: 312_456_790,
            }),
            mockConfirmedSignatureInfo({
                blockTime: null,
                signature: 'dbaW9stableSignaturePlaceholderForMobileTabletSwitch3fa3ew',
                slot: 312_456_791,
            }),
        ],
        foundOldest: false,
    }),
};

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta: Meta<typeof TransactionHistoryCard> = {
    component: TransactionHistoryCard,
    decorators: [
        withMockRpc,
        withViewportFromGlobal,
        Story => (
            <ClusterProvider>
                <MockAccountsProvider>
                    <MockTransactionsProvider>
                        <MockHistoryProvider history={HISTORY}>
                            <Story />
                        </MockHistoryProvider>
                    </MockTransactionsProvider>
                </MockAccountsProvider>
            </ClusterProvider>
        ),
    ],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/TransactionHistory/TransactionHistoryCard/Responsive',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { address: ADDRESS };

export const Mobile: Story = {
    args,
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    args,
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    args,
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};

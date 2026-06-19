import { ClusterProvider } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { MockAccountsProvider } from '@storybook-config/__mocks__/MockAccountsProvider';
import { MockTokenInfoBatchProvider } from '@storybook-config/__mocks__/MockTokenInfoBatchProvider';
import { nextjsParameters } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { BigNumber } from 'bignumber.js';
import React from 'react';

import { DEFAULT_SIGNATURE, MOCK_PARSED_TX, MOCK_STATUS, RECIPIENT, TOKEN_MINT } from '../__fixtures__/transaction';
import { withTransactionProviders } from '../__fixtures__/withTransactionProviders';
import { TokenBalancesCard, TokenBalancesCardInner } from '../TokenBalancesCard';

const metaConnected: Meta<typeof TokenBalancesCard> = {
    args: {
        signature: DEFAULT_SIGNATURE,
    },
    component: TokenBalancesCard,
    parameters: {
        ...nextjsParameters,
    },
    tags: ['autodocs', 'test'],
    title: 'Features/Transaction/TokenBalancesCard',
};

export default metaConnected;
type Story = StoryObj<typeof metaConnected>;

export const WithTokenBalances: Story = {
    decorators: [
        Story => {
            const Wrapper = withTransactionProviders(
                { [DEFAULT_SIGNATURE]: MOCK_PARSED_TX },
                { [DEFAULT_SIGNATURE]: MOCK_STATUS },
            );
            return (
                <Wrapper>
                    <Story />
                </Wrapper>
            );
        },
    ],
};

export const NoBalanceChanges: Story = {
    decorators: [
        Story => {
            const Wrapper = withTransactionProviders({}, {});
            return (
                <Wrapper>
                    <Story />
                </Wrapper>
            );
        },
    ],
};

const SAMPLE_ROWS = [
    {
        account: RECIPIENT,
        accountIndex: 0,
        balance: '1.5',
        delta: new BigNumber('1.0'),
        mint: TOKEN_MINT.toBase58(),
        owner: RECIPIENT.toBase58(),
    },
    {
        account: new PublicKey('GsbwXfJraMomNxBcpR3DBr9yoWR2PmN93PEaYJz7MSTN'),
        accountIndex: 1,
        balance: '50.25',
        delta: new BigNumber('-2.5'),
        mint: new PublicKey('So11111111111111111111111111111111111111112').toBase58(),
        owner: new PublicKey('9noXzpXnkyEcKF3AeXqUHTdR59V5uvrRBUZ9bwfQwxNq').toBase58(),
    },
];

export const Inner_MultipleRows: StoryObj<typeof TokenBalancesCardInner> = {
    args: {
        rows: SAMPLE_ROWS,
    },
    render: args => (
        <ClusterProvider>
            <MockTokenInfoBatchProvider>
                <MockAccountsProvider>
                    <TokenBalancesCardInner {...args} />
                </MockAccountsProvider>
            </MockTokenInfoBatchProvider>
        </ClusterProvider>
    ),
};

export const Inner_PositiveDelta: StoryObj<typeof TokenBalancesCardInner> = {
    args: {
        rows: [SAMPLE_ROWS[0]],
    },
    render: args => (
        <ClusterProvider>
            <MockTokenInfoBatchProvider>
                <MockAccountsProvider>
                    <TokenBalancesCardInner {...args} />
                </MockAccountsProvider>
            </MockTokenInfoBatchProvider>
        </ClusterProvider>
    ),
};

export const Inner_NegativeDelta: StoryObj<typeof TokenBalancesCardInner> = {
    args: {
        rows: [SAMPLE_ROWS[1]],
    },
    render: args => (
        <ClusterProvider>
            <MockTokenInfoBatchProvider>
                <MockAccountsProvider>
                    <TokenBalancesCardInner {...args} />
                </MockAccountsProvider>
            </MockTokenInfoBatchProvider>
        </ClusterProvider>
    ),
};

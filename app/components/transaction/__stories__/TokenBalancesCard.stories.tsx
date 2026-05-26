import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withMockTransactions, withTokenInfoBatch } from '@storybook-config/decorators';
import BigNumber from 'bignumber.js';

import { TokenBalancesCardInner, type TokenBalancesCardInnerProps } from '../TokenBalancesCard';

const meta: Meta<typeof TokenBalancesCardInner> = {
    component: TokenBalancesCardInner,
    decorators: [withTokenInfoBatch, withMockTransactions],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/Transaction/TokenBalancesCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleRows: TokenBalancesCardInnerProps['rows'] = [
    {
        account: new PublicKey('11111111111111111111111111111111'),
        accountIndex: 0,
        balance: '1.234',
        delta: new BigNumber('1.234'),
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    },
    {
        account: new PublicKey('SysvarRent111111111111111111111111111111111'),
        accountIndex: 1,
        balance: '42.0',
        delta: new BigNumber('-0.5'),
        mint: 'So11111111111111111111111111111111111111112',
    },
];

export const WithRows: Story = {
    args: { rows: sampleRows },
};

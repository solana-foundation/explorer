import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withMockTransactions, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import BigNumber from 'bignumber.js';

import { TokenBalancesCardInner, type TokenBalancesCardInnerProps } from '../TokenBalancesCard';

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

const meta: Meta<typeof TokenBalancesCardInner> = {
    component: TokenBalancesCardInner,
    decorators: [withTokenInfoBatch, withMockTransactions, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Transaction/TokenBalancesCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { rows: sampleRows };

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };

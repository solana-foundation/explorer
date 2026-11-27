import { PublicKey } from '@solana/web3.js';
import { nextjsParameters, withMockTransactions, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { TokenBalancesCardInner, type TokenBalancesCardInnerProps } from '../TokenBalancesCard';

const sampleRows: TokenBalancesCardInnerProps['rows'] = [
    {
        account: new PublicKey('11111111111111111111111111111111'),
        accountIndex: 0,
        decimals: 6,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        postAmount: '1234000',
        preAmount: '0',
    },
    {
        account: new PublicKey('SysvarRent111111111111111111111111111111111'),
        accountIndex: 1,
        decimals: 9,
        mint: 'So11111111111111111111111111111111111111112',
        postAmount: '42000000000',
        preAmount: '42500000000',
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

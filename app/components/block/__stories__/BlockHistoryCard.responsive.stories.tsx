import type { VersionedBlockResponse } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { nextjsParameters, withCluster } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { BlockHistoryCard } from '../BlockHistoryCard';

const emptyBlock = {
    blockTime: null,
    blockhash: 'GnPnX9Y6w6vYi3iWQGfh',
    parentSlot: 0,
    previousBlockhash: 'GnPnX9Y6w6vYi3iWQGfh',
    transactions: [],
} as unknown as VersionedBlockResponse;

const meta: Meta<typeof BlockHistoryCard> = {
    component: BlockHistoryCard,
    decorators: [withCluster, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Block/BlockHistoryCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { block: emptyBlock, epoch: 500n };

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };

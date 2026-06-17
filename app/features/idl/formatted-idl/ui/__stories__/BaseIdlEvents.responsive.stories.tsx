import type { Meta, StoryObj } from '@storybook/react';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { BaseIdlEvents } from '../BaseIdlEvents';

const meta: Meta<typeof BaseIdlEvents> = {
    component: BaseIdlEvents,
    decorators: [withViewportFromGlobal],
    parameters: {
        nextjs: { appDirectory: true },
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Formatted IDL/BaseIdlEvents@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    data: [
        {
            docs: ['Emitted when an NFT is sold on the marketplace'],
            fieldType: {
                fields: [
                    { docs: ['NFT mint address'], name: 'tokenMint', type: 'publicKey' },
                    { name: 'seller', type: 'publicKey' },
                    { docs: ['Sale price in lamports'], name: 'price', type: 'u64' },
                ],
                kind: 'struct' as const,
            },
            name: 'MarketItemSold',
        },
    ],
};

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };

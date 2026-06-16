import type { Meta, StoryObj } from '@storybook/react';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { BaseIdlTypes } from '../BaseIdlTypes';

const meta: Meta<typeof BaseIdlTypes> = {
    component: BaseIdlTypes,
    decorators: [withViewportFromGlobal],
    parameters: {
        nextjs: { appDirectory: true },
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Formatted IDL/UI/BaseIdlTypes@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    data: [
        {
            docs: ['Complete market state'],
            fieldType: {
                fields: [
                    { name: 'id', type: 'u64' },
                    { name: 'owner', type: 'publicKey' },
                    { docs: ['Market configuration'], name: 'config', type: 'MarketConfig' },
                ],
                kind: 'struct' as const,
            },
            name: 'MarketState',
        },
    ],
};

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };

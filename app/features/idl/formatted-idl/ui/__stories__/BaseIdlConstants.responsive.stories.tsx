import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { BaseIdlConstants } from '../BaseIdlConstants';

const meta: Meta<typeof BaseIdlConstants> = {
    component: BaseIdlConstants,
    decorators: [withViewportFromGlobal],
    parameters: {
        nextjs: { appDirectory: true },
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Formatted IDL/BaseIdlConstants@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    data: [
        {
            docs: ['Maximum number of users allowed'],
            name: 'MAX_USERS',
            type: 'u16',
            value: '1000',
        },
        {
            docs: ['Minimum deposit amount in lamports'],
            name: 'MIN_DEPOSIT',
            type: 'u64',
            value: '10000000',
        },
    ],
};

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };

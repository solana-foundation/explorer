import type { Meta, StoryObj } from '@storybook/react';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { BaseIdlErrors } from '../BaseIdlErrors';

const meta: Meta<typeof BaseIdlErrors> = {
    component: BaseIdlErrors,
    decorators: [withViewportFromGlobal],
    parameters: {
        nextjs: { appDirectory: true },
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Formatted IDL/UI/BaseIdlErrors/Responsive',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    data: [
        {
            code: '100',
            message: 'The provided owner is not valid for this operation',
            name: 'InvalidOwner',
        },
        {
            code: '101',
            message: 'The account has insufficient funds for this operation',
            name: 'InsufficientFunds',
        },
    ],
};

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };

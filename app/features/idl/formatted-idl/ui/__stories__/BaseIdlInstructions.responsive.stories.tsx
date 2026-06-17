import type { Meta, StoryObj } from '@storybook/react';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { BaseIdlInstructions } from '../BaseIdlInstructions';

const meta: Meta<typeof BaseIdlInstructions> = {
    component: BaseIdlInstructions,
    decorators: [withViewportFromGlobal],
    parameters: {
        nextjs: { appDirectory: true },
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Formatted IDL/BaseIdlInstructions@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    data: [
        {
            accounts: [
                { docs: ['Account that can update the data'], name: 'authority', signer: true, writable: false },
                { docs: ['Account to initialize'], name: 'newAccount', signer: false, writable: true },
            ],
            args: [{ docs: ['Initial value'], name: 'data', type: 'u64' }],
            docs: ['Initialize a new account'],
            name: 'initialize',
        },
    ],
};

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };

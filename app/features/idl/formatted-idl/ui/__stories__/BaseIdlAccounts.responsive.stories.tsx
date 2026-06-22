import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseIdlAccounts } from '../BaseIdlAccounts';

const meta: Meta<typeof BaseIdlAccounts> = {
    component: BaseIdlAccounts,
    decorators: [withViewportFromGlobal],
    parameters: {
        nextjs: { appDirectory: true },
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Formatted IDL/BaseIdlAccounts@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    data: [
        {
            docs: ['Stores user information and balance'],
            fieldType: {
                fields: [
                    { name: 'owner', type: 'publicKey' },
                    { name: 'balance', type: 'u64' },
                    { name: 'active', type: 'bool' },
                ],
                kind: 'struct' as const,
            },
            name: 'UserAccount',
        },
    ],
};

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };

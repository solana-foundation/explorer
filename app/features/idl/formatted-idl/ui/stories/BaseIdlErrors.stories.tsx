import type { Meta, StoryObj } from '@storybook/react';

import { BaseIdlErrors } from '../BaseIdlErrors';

const meta = {
    component: BaseIdlErrors,
    decorators: [
        Story => (
            <div>
                <Story />
            </div>
        ),
    ],
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Formatted IDL/UI/BaseIdlErrors',
} satisfies Meta<typeof BaseIdlErrors>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicErrors: Story = {
    args: {
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
            {
                code: '102',
                message: 'The signer is not authorized to perform this action',
                name: 'Unauthorized',
            },
        ],
    },
};

export const NoErrors: Story = {
    args: {
        data: [],
    },
};

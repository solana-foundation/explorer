import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { BaseNativeSelect } from '../BaseNativeSelect';

const OPTIONS = ['Transactions', 'Rewards', 'Programs', 'Accounts'];

const meta: Meta<typeof BaseNativeSelect> = {
    args: {
        'aria-label': 'Example select',
        onChange: fn(),
    },
    component: BaseNativeSelect,
    title: 'Components/Shared/UI/NativeSelect',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Dark: Story = {
    args: {
        variant: 'dark',
    },
    render: args => (
        <BaseNativeSelect {...args}>
            {OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                    {opt}
                </option>
            ))}
        </BaseNativeSelect>
    ),
};

export const Navigation: Story = {
    args: {
        icon: 'menu',
        variant: 'navigation',
    },
    render: args => (
        <BaseNativeSelect {...args}>
            {OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                    {opt}
                </option>
            ))}
        </BaseNativeSelect>
    ),
};

export const NavigationNarrow: Story = {
    args: {
        icon: 'menu',
        variant: 'navigation',
    },
    render: args => (
        <div style={{ maxWidth: 375 }}>
            <BaseNativeSelect {...args} className="e-w-full">
                {OPTIONS.map(opt => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </BaseNativeSelect>
        </div>
    ),
};

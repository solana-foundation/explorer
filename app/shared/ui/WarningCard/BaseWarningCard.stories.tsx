import type { Meta, StoryObj } from '@storybook/react';

import { BaseWarningCard } from './BaseWarningCard';

const meta: Meta<typeof BaseWarningCard> = {
    component: BaseWarningCard,
    tags: ['autodocs'],
    title: 'Components/Shared/UI/WarningCard/BaseWarningCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        message: 'Something needs your attention',
    },
};

export const WithDescription: Story = {
    args: {
        description: 'Additional context goes underneath the headline message.',
        message: 'Something needs your attention',
    },
};

export const ChildrenInsteadOfMessage: Story = {
    render: () => (
        <BaseWarningCard>
            <span>
                Use <code>children</code> when the body is richer than a plain message.
            </span>
        </BaseWarningCard>
    ),
};

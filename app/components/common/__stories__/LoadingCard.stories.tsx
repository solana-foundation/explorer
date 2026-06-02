import type { Meta, StoryObj } from '@storybook/react';

import { LoadingCard } from '../LoadingCard';

const meta: Meta<typeof LoadingCard> = {
    component: LoadingCard,
    tags: ['autodocs'],
    title: 'Components/Common/LoadingCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithMessage: Story = {
    args: { message: 'Loading account data…' },
};

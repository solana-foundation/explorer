import type { Meta, StoryObj } from '@storybook/react';

import { BottomLine } from '../BottomLine';

const meta: Meta<typeof BottomLine> = {
    component: BottomLine,
    tags: ['autodocs'],
    title: 'Features/Receipt/BottomLine',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Tinted: Story = {
    args: {
        style: { color: '#22c55e' },
    },
};

export const Accent: Story = {
    args: {
        style: { color: '#a855f7' },
    },
};

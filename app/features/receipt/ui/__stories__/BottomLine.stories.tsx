import type { Meta, StoryObj } from '@storybook-config/types';

import { BottomLine } from '../BottomLine';

const meta: Meta<typeof BottomLine> = {
    component: BottomLine,
    tags: ['autodocs', 'test'],
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

import type { Meta, StoryObj } from '@storybook-config/types';
import { fn } from 'storybook/test';

import { RawInput } from '../RawInputCard';

const meta = {
    component: RawInput,
    tags: ['autodocs', 'test'],
    title: 'Components/Inspector/RawInputCard',
} satisfies Meta<typeof RawInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
    args: {
        setTransactionData: fn(),
    },
};

export const Prefilled: Story = {
    args: {
        setTransactionData: fn(),
        value: '11111111111111111111111111111111',
    },
};

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { Logo } from '../SolanaLogo';

const meta = {
    argTypes: {
        variant: {
            control: 'radio',
            options: ['gradient', 'green'],
        },
    },
    component: Logo,
    parameters: { layout: 'padded' },
    tags: ['autodocs', 'test'],
    title: 'Shared/SolanaLogo',
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gradient: Story = {
    args: {
        variant: 'gradient',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const logo = canvas.getByRole('img', { name: 'Solana' });
        expect(logo).toBeInTheDocument();
    },
};

export const Green: Story = {
    args: {
        variant: 'green',
    },
};

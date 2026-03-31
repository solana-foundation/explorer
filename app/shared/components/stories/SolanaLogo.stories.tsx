import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { Logo } from '../SolanaLogo';

const meta: Meta<typeof Logo> = {
    argTypes: {
        variant: {
            control: 'radio',
            options: ['gradient', 'green'],
        },
    },
    component: Logo,
    parameters: {
        layout: 'centered',
    },
    title: 'Shared/UI/SolanaLogo',
};

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

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

import { ExternalLink } from './external-link';

const meta: Meta<typeof ExternalLink> = {
    component: ExternalLink,
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/ExternalLink',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'solana.com',
        href: 'https://solana.com',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const link = canvas.getByRole('link', { name: 'solana.com' });
        await expect(link).toHaveAttribute('href', 'https://solana.com');
        await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        await expect(link).toHaveAttribute('target', '_blank');
    },
};

export const UnsafeSchemeRendersNothing: Story = {
    args: {
        children: 'should not render',
        href: 'javascript:alert(1)',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByText('should not render')).not.toBeInTheDocument();
    },
};

export const MissingHrefRendersNothing: Story = {
    args: {
        children: 'should not render',
        href: undefined,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByText('should not render')).not.toBeInTheDocument();
    },
};

export const RelativeHrefRendersNothing: Story = {
    args: {
        children: 'should not render',
        href: '/address/abc',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByText('should not render')).not.toBeInTheDocument();
    },
};

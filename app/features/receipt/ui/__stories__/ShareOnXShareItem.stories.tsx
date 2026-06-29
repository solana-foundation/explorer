import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, fn, userEvent, within } from 'storybook/test';

import { ShareOnXShareItem } from '../ShareOnXShareItem';

const meta: Meta<typeof ShareOnXShareItem> = {
    args: {
        onShare: fn(),
    },
    component: ShareOnXShareItem,
    tags: ['autodocs', 'test'],
    title: 'Features/Receipt/ShareOnXShareItem',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        // eslint-disable-next-line no-restricted-syntax -- case-insensitive accessible name match for testing-library query
        const button = canvas.getByRole('button', { name: /share on x/i });
        await expect(button).toBeInTheDocument();

        const openSpy = fn();
        const originalOpen = globalThis.open;
        globalThis.open = openSpy as typeof globalThis.open;
        try {
            await userEvent.click(button);
            await expect(openSpy).toHaveBeenCalledOnce();
            await expect(args.onShare).toHaveBeenCalledOnce();
        } finally {
            globalThis.open = originalOpen;
        }
    },
};

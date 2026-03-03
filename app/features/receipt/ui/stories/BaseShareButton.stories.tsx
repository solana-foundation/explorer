import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { BaseShareButton } from '../BaseShareButton';

const meta: Meta<typeof BaseShareButton> = {
    args: {
        onCopyLink: fn(),
    },
    component: BaseShareButton,
    tags: ['autodocs', 'test'],
    title: 'Features/Receipt/BaseShareButton',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        // eslint-disable-next-line no-restricted-syntax -- case-insensitive accessible name match for testing-library query
        const trigger = canvas.getByRole('button', { name: /share/i });
        await expect(trigger).toBeInTheDocument();

        await userEvent.click(trigger);

        // eslint-disable-next-line no-restricted-syntax -- case-insensitive accessible name match for testing-library query
        const copyButton = await within(document.body).findByRole('button', { name: /copy link/i });
        await expect(copyButton).toBeInTheDocument();

        await userEvent.click(copyButton);
        await expect(args.onCopyLink).toHaveBeenCalledOnce();
    },
};

export const Copied: Story = {
    args: {
        copied: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // eslint-disable-next-line no-restricted-syntax -- case-insensitive accessible name match for testing-library query
        await userEvent.click(canvas.getByRole('button', { name: /share/i }));

        // eslint-disable-next-line no-restricted-syntax -- case-insensitive accessible name match for testing-library query
        const copiedButton = await within(document.body).findByRole('button', { name: /copied/i });
        await expect(copiedButton).toBeInTheDocument();
    },
};

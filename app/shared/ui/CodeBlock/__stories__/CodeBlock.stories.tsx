import { withClipboardMock, withClipboardMockErrored } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, userEvent, within } from 'storybook/test';

import { CodeBlock } from '../CodeBlock';

const ADD_COMMAND = 'claude mcp add --transport http solana-explorer https://explorer.solana.com/mcp';

const meta: Meta<typeof CodeBlock> = {
    args: { caption: 'Terminal', code: ADD_COMMAND },
    component: CodeBlock,
    tags: ['autodocs', 'test'],
    title: 'Shared/CodeBlock/CodeBlock',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    decorators: [withClipboardMock],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByRole('button', { name: 'Copy code' }));

        await expect(navigator.clipboard.writeText).toHaveBeenCalledWith(ADD_COMMAND);
        await expect(canvas.getByRole('button', { name: 'Copied' })).toBeVisible();
    },
};

export const CopyRejected: Story = {
    decorators: [withClipboardMockErrored],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByRole('button', { name: 'Copy code' }));

        await expect(canvas.getByRole('button', { name: 'Copy failed' })).toBeVisible();
    },
};

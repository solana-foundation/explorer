import { withClipboardMock } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, userEvent, within } from 'storybook/test';

import { McpSetupTabs } from '../McpSetupTabs';

const meta: Meta<typeof McpSetupTabs> = {
    component: McpSetupTabs,
    tags: ['autodocs', 'test'],
    title: 'Features/McpLanding/McpSetupTabs',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByRole('tab', { name: 'Codex' }));
        await expect(canvas.getByText('~/.codex/config.toml')).toBeVisible();

        await userEvent.click(canvas.getByRole('tab', { name: 'VS Code' }));
        await expect(canvas.getByText('.vscode/mcp.json')).toBeVisible();
    },
};

export const Copy: Story = {
    decorators: [withClipboardMock],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getAllByRole('button', { name: 'Copy code' })[0]);

        await expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            'claude mcp add --transport http solana-explorer https://explorer.solana.com/mcp',
        );
        await expect(canvas.getByRole('button', { name: 'Copied' })).toBeVisible();
    },
};

import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, userEvent, within } from 'storybook/test';

import { Setup } from '../Setup';
import { withMcpBand } from './mcp-band-decorator';

const meta: Meta<typeof Setup> = {
    args: { origin: 'https://explorer.solana.com' },
    component: Setup,
    decorators: [withMcpBand],
    parameters: { layout: 'padded' },
    tags: ['autodocs', 'test'],
    title: 'Features/McpDocs/Setup',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SwitchClient: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByRole('tab', { name: 'Cursor' }));
        await expect(await canvas.findByText('mcpServers', { exact: false })).toBeVisible();
    },
};

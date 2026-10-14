import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, userEvent, within } from 'storybook/test';

import { Tools } from '../Tools';
import { withMcpBand } from './mcp-band-decorator';

const meta: Meta<typeof Tools> = {
    component: Tools,
    decorators: [withMcpBand],
    parameters: { layout: 'padded' },
    tags: ['autodocs', 'test'],
    title: 'Features/McpDocs/Tools',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SwitchToResponse: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getAllByRole('tab', { name: 'Response' })[0]);
        await expect(await canvas.findByText('EPjFWdd5', { exact: false })).toBeVisible();
    },
};

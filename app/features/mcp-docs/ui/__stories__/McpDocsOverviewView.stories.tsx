import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, userEvent, within } from 'storybook/test';

import { McpDocsOverviewView } from '../McpDocsOverviewView';

const meta: Meta<typeof McpDocsOverviewView> = {
    component: McpDocsOverviewView,
    parameters: { layout: 'fullscreen' },
    tags: ['autodocs', 'test'],
    title: 'Features/McpDocs/Overview',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SwitchesSections: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByRole('tab', { name: 'Cursor' }));
        await expect(await canvas.findByText('mcpServers', { exact: false })).toBeVisible();

        await userEvent.click(canvas.getAllByRole('tab', { name: 'Response' })[0]);
        await expect(await canvas.findByText('EPjFWdd5', { exact: false })).toBeVisible();
    },
};

import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { ExamplesCarousel } from '../ExamplesCarousel';

const meta: Meta<typeof ExamplesCarousel> = {
    component: ExamplesCarousel,
    globals: { backgrounds: { value: 'dark' } },
    parameters: { layout: 'padded' },
    tags: ['autodocs', 'test'],
    title: 'Features/McpDocs/ExamplesCarousel',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Selecting a conversation from the chat list swaps in its question and answer. */
export const SelectConversation: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByRole('tab', { name: 'Program inspection' }));
        // Assert on a phrase unique to this answer — "Squads Multisig Program" appears twice in it.
        const answer = await canvas.findByText('BPF upgradeable-loader program', { exact: false });
        // The conversation cross-fades in over a 500ms opacity transition; poll until it's fully visible.
        await waitFor(() => expect(answer).toBeVisible());
    },
};

/** Long conversations start collapsed; "Expand message" reveals the tail. */
export const ExpandMessage: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByRole('tab', { name: 'Transaction walkthrough' }));
        await userEvent.click(await canvas.findByRole('button', { name: 'Expand message' }));
        const tail = await canvas.findByText('Instruction 1 — ComputeBudget', { exact: false });
        // The conversation cross-fades in over a 500ms opacity transition; poll until it's fully visible.
        await waitFor(() => expect(tail).toBeVisible());
    },
};

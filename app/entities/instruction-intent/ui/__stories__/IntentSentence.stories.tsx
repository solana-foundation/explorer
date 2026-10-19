import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { DESTINATION, SOURCE, SYSTEM_PROGRAM_ADDRESS } from '../../mocks/fixtures';
import { IntentSentence } from '../IntentSentence';

const meta = {
    component: IntentSentence,
    decorators: [withCluster, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Entities/InstructionIntent/IntentSentence',
} satisfies Meta<typeof IntentSentence>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithAddresses: Story = {
    args: {
        parts: [
            { kind: 'text', text: 'Transfer 1.5 SOL from ' },
            { address: SOURCE, kind: 'address' },
            { kind: 'text', text: ' to ' },
            { address: DESTINATION, kind: 'address' },
        ],
    },
    play: async ({ canvasElement }) => {
        const links = within(canvasElement).getAllByRole('link');

        await expect(links).toHaveLength(2);
        await expect(links[0]).toHaveTextContent(`${SOURCE.slice(0, 5)}…${SOURCE.slice(-5)}`);
        await expect(links[0]).toHaveAttribute('href', expect.stringContaining(SOURCE));
        await expect(links[1]).toHaveTextContent(`${DESTINATION.slice(0, 5)}…${DESTINATION.slice(-5)}`);
        await expect(links[0].closest('[data-address]')).toHaveAttribute('data-address', SOURCE);
    },
};

export const WithKnownAddress: Story = {
    args: {
        parts: [
            { kind: 'text', text: 'Invoke ' },
            { address: SYSTEM_PROGRAM_ADDRESS, kind: 'address' },
        ],
    },
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('link')).toHaveTextContent('System Program');
    },
};

export const ProseOnly: Story = {
    args: { parts: [{ kind: 'text', text: 'Mint tokens' }] },
};

export const WithLongUnbrokenText: Story = {
    args: { parts: [{ kind: 'text', text: `Add memo "${'xlc1.1.23Sg4hdeVFZRMAvJgBeZEmhTsNtXW35Ys'.repeat(10)}"` }] },
    play: async ({ canvasElement }) => {
        const sentence = within(canvasElement).getByTestId('intent-sentence');
        sentence.style.width = 'min-content';
        const minContentWidth = sentence.getBoundingClientRect().width;
        sentence.style.width = '';

        await expect(minContentWidth).toBeLessThan(canvasElement.getBoundingClientRect().width);
    },
};

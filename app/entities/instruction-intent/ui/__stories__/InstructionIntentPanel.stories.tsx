import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, fn, userEvent, within } from 'storybook/test';

import type { InstructionIntent } from '../../lib/intent';
import { DESTINATION, SOURCE } from '../../mocks/fixtures';
import { InstructionIntentPanel } from '../InstructionIntentPanel';

const TRANSFER: InstructionIntent = {
    fields: [],
    interpolated: true,
    sentenceParts: [
        { kind: 'text', text: 'Transfer 100000000 base units from ' },
        { address: SOURCE, kind: 'address' },
        { kind: 'text', text: ' to ' },
        { address: DESTINATION, kind: 'address' },
    ],
    usedAccountData: false,
};

const retry = fn();

const meta = {
    args: { id: 'intent-panel', intent: { status: 'loading' } },
    component: InstructionIntentPanel,
    decorators: [withCluster, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Entities/InstructionIntent/InstructionIntentPanel',
} satisfies Meta<typeof InstructionIntentPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {};

export const Ready: Story = {
    args: { intent: { result: TRANSFER, status: 'ready' } },
};

export const ReadyWithAccountData: Story = {
    args: { intent: { result: { ...TRANSFER, usedAccountData: true }, status: 'ready' } },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByText(
                'Uses current account data, which may differ from the time of this transaction.',
            ),
        ).toBeInTheDocument();
    },
};

export const ReadyWithoutSentence: Story = {
    args: {
        intent: {
            result: { ...TRANSFER, interpolated: false, sentenceParts: [{ kind: 'text', text: 'Mint tokens' }] },
            status: 'ready',
        },
    },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByText(
                "Couldn't fill in the details for this instruction. The rows below carry them.",
            ),
        ).toBeInTheDocument();
    },
};

export const Failed: Story = {
    args: { intent: { retry, status: 'failed' } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByTestId('instruction-intent-retry'));
        await expect(retry).toHaveBeenCalledOnce();
    },
};

export const FailedWithoutRetry: Story = {
    args: { intent: { status: 'failed' } },
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).queryByTestId('instruction-intent-retry')).not.toBeInTheDocument();
    },
};

export const NoMetadata: Story = {
    args: { intent: { reason: 'no-metadata', status: 'unavailable' } },
};

export const NoInstructionIntent: Story = {
    args: { intent: { reason: 'no-instruction-intent', status: 'unavailable' } },
};

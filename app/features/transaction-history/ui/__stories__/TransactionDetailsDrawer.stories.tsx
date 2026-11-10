import { MockClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';
import { nextjsParameters } from '@storybook-config/decorators';
import type { Decorator, Meta, StoryObj } from '@storybook-config/types';
import { expect, fn, userEvent, within } from 'storybook/test';

import { TransactionDetailsDrawer } from '../TransactionDetailsDrawer';

const SIGNATURE = '2JgaFoExampleDetailsDrawerSignaturePlaceholderForStoriesZBbGUabcdefghijkmnopqrstuv';
const SLOT = 312_456_789;
const BLOCK_TIME = 1_718_000_000;

// Representative wire bytes so the raw-data field shows a byte count and enables copy/download.
const MESSAGE_BYTES = new Uint8Array(Array.from({ length: 215 }, (_, i) => i % 256));

// The drawer builds its tx and block links from the cluster.
const withCluster: Decorator = Story => (
    <MockClusterProvider>
        <Story />
    </MockClusterProvider>
);

const meta = {
    args: {
        blockTime: BLOCK_TIME,
        onOpenChange: fn(),
        open: true,
        rowTransaction: {
            messageBytes: MESSAGE_BYTES,
            status: 'loaded',
            summaries: [
                { name: 'Transfer', programName: 'System' },
                { name: 'CreateAccount', programName: 'System' },
            ],
        },
        signature: SIGNATURE,
        slot: SLOT,
        statusLabel: 'Success',
        statusVariant: 'success',
    },
    component: TransactionDetailsDrawer,
    decorators: [withCluster],
    parameters: {
        ...nextjsParameters,
        viewport: { defaultViewport: 'mobile1' },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/TransactionHistory/TransactionDetailsDrawer@Media',
} satisfies Meta<typeof TransactionDetailsDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Fully loaded: timestamp, block link, program list, and the size from the row's own bytes.
export const Default: Story = {
    play: async () => {
        // The drawer renders in a portal outside the story canvas.
        await expect(await within(document.body).findByText('215 bytes')).toBeVisible();
    },
};

// A failed transaction shows the warning badge.
export const Failed: Story = {
    args: {
        rowTransaction: {
            messageBytes: MESSAGE_BYTES,
            status: 'loaded',
            summaries: [{ name: 'Transfer', programName: 'System' }],
        },
        statusLabel: 'Failed',
        statusVariant: 'warning',
    },
};

// The row is still loading, so the program list shows its skeleton and the raw-data field its loader.
export const Loading: Story = {
    args: { rowTransaction: { status: 'loading' } },
};

// No block time and no instructions to list, so the Time row is hidden and Programs shows "---".
export const Unavailable: Story = {
    args: { blockTime: null, rowTransaction: { messageBytes: MESSAGE_BYTES, status: 'loaded', summaries: [] } },
};

// The row fetch failed, so Programs and Size each offer a retry.
const retryRow = fn();
export const ProgramsFailed: Story = {
    args: { rowTransaction: { retry: retryRow, status: 'failed' } },
    play: async () => {
        // The drawer renders in a portal outside the story canvas.
        const body = within(document.body);
        await userEvent.click(await body.findByRole('button', { name: 'Retry loading programs' }));
        await userEvent.click(await body.findByRole('button', { name: 'Retry loading size' }));
        await expect(retryRow).toHaveBeenCalledTimes(2);
        await expect(body.queryByText('No data')).toBeNull();
    },
};

import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import {
    createNextjsParameters,
    withClipboardMock,
    withCluster,
    withTokenInfoBatch,
} from '@storybook-config/decorators';
import { expect, within } from 'storybook/test';

import { Address } from '../Address';

const WSOL = new PublicKey('So11111111111111111111111111111111111111112');

const meta = {
    component: Address,
    decorators: [withClipboardMock, withTokenInfoBatch, withCluster],
    parameters: createNextjsParameters(),
    tags: ['test'],
    title: 'Components/Common/Address',
} satisfies Meta<typeof Address>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        pubkey: WSOL,
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        expect(canvas.getByText('So11111111111111111111111111111111111111112')).toBeInTheDocument();
    },
};

export const WithLink: Story = {
    args: {
        link: true,
        pubkey: WSOL,
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        expect(canvas.getByRole('link')).toBeInTheDocument();
    },
};

export const AlignRight: Story = {
    args: {
        alignRight: true,
        pubkey: WSOL,
    },
    decorators: [
        Story => (
            <div style={{ width: '100%' }}>
                <Story />
            </div>
        ),
    ],
};

export const Raw: Story = {
    args: {
        pubkey: WSOL,
        raw: true,
    },
};

export const WithOverrideText: Story = {
    args: {
        overrideText: 'Wrapped SOL',
        pubkey: WSOL,
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Wrapped SOL')).toBeInTheDocument();
    },
};

export const NoTruncate: Story = {
    args: {
        noTruncate: true,
        pubkey: WSOL,
    },
    decorators: [
        Story => (
            <div style={{ width: 500 }}>
                <Story />
            </div>
        ),
    ],
};

/** Narrow container triggers mid-truncation: "So111...11112" */
export const Truncated: Story = {
    args: {
        pubkey: WSOL,
    },
    decorators: [
        Story => (
            <div style={{ width: 200 }}>
                <Story />
            </div>
        ),
    ],
};

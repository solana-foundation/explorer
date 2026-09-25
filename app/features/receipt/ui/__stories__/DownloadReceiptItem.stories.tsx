import type { Meta, StoryObj } from '@storybook-config/types';
import React from 'react';
import { Download } from 'react-feather';
import { expect, fn, userEvent, within } from 'storybook/test';

import { DownloadReceiptItem } from '../DownloadReceiptItem';

const meta: Meta<typeof DownloadReceiptItem> = {
    args: {
        download: fn().mockResolvedValue(undefined),
        icon: <Download size={11} />,
        label: 'Download PNG',
        signature: '5UfDuX7hXbGjGHqPXRGaHdSecretSignature1234567890abcdef',
    },
    component: DownloadReceiptItem,
    decorators: [
        Story => (
            <div style={{ width: 150 }}>
                <Story />
            </div>
        ),
    ],
    tags: ['autodocs', 'test'],
    title: 'Features/Receipt/DownloadReceiptItem',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    beforeEach({ args }) {
        (args.download as ReturnType<typeof fn>).mockResolvedValue(undefined);
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        const button = canvas.getByRole('button', { name: 'Download PNG' });
        await expect(button).toBeInTheDocument();

        await userEvent.click(button);

        await expect(args.download).toHaveBeenCalledOnce();

        await expect(canvas.getByRole('button', { name: 'Download PNG' })).toBeInTheDocument();
    },
};

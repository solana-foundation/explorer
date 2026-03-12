import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Download } from 'react-feather';
import { expect, fn, userEvent, within } from 'storybook/test';
import { vi } from 'vitest';

import { DownloadReceiptItem } from '../DownloadReceiptItem';

const meta: Meta<typeof DownloadReceiptItem> = {
    args: {
        download: fn().mockResolvedValue(undefined),
        icon: <Download size={11} />,
        label: 'Download PNG',
    },
    component: DownloadReceiptItem,
    tags: ['autodocs', 'test'],
    title: 'Features/Receipt/DownloadReceiptItem',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    beforeEach({ args }) {
        vi.mocked(args.download).mockResolvedValue(undefined);
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // eslint-disable-next-line no-restricted-syntax -- case-insensitive accessible name match for testing-library query
        const button = canvas.getByRole('button', { name: /download png/i });
        await expect(button).toBeInTheDocument();

        await userEvent.click(button);

        // eslint-disable-next-line no-restricted-syntax -- case-insensitive accessible name match for testing-library query
        await expect(canvas.getByRole('button', { name: /downloaded/i })).toBeInTheDocument();
    },
};

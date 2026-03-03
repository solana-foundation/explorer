import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { CopyLinkShareItem } from '../CopyLinkShareItem';
import { withClipboardMock } from './decorators';

const meta: Meta<typeof CopyLinkShareItem> = {
    component: CopyLinkShareItem,
    decorators: [withClipboardMock],
    tags: ['autodocs', 'test'],
    title: 'Features/Receipt/CopyLinkShareItem',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // eslint-disable-next-line no-restricted-syntax -- case-insensitive accessible name match for testing-library query
        const button = canvas.getByRole('button', { name: /copy link/i });
        await expect(button).toBeInTheDocument();

        await userEvent.click(button);

        // eslint-disable-next-line no-restricted-syntax -- case-insensitive accessible name match for testing-library query
        await expect(canvas.getByRole('button', { name: /copied/i })).toBeInTheDocument();
    },
};

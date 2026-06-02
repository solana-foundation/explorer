import type { Meta, StoryObj } from '@storybook/react';
import { withClipboardMock } from '@storybook-config/decorators';
import { Share2 } from 'react-feather';
import { expect, userEvent, within } from 'storybook/test';

import { CopyLinkShareItem } from '../CopyLinkShareItem';
import { PopoverButton } from '../PopoverButton';

const meta: Meta<typeof PopoverButton> = {
    args: {
        children: <CopyLinkShareItem />,
        icon: <Share2 size={12} />,
        label: 'Share',
    },
    component: PopoverButton,
    decorators: [withClipboardMock],
    tags: ['autodocs', 'test'],
    title: 'Features/Receipt/PopoverButton',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithCopyLink: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // eslint-disable-next-line no-restricted-syntax -- case-insensitive accessible name match for testing-library query
        const trigger = canvas.getByRole('button', { name: /share/i });
        await expect(trigger).toBeInTheDocument();

        await userEvent.click(trigger);

        // eslint-disable-next-line no-restricted-syntax -- case-insensitive accessible name match for testing-library query
        const copyButton = await within(document.body).findByRole('button', { name: /copy link/i });
        await expect(copyButton).toBeInTheDocument();

        await userEvent.click(copyButton);

        // eslint-disable-next-line no-restricted-syntax -- case-insensitive accessible name match for testing-library query
        const copiedButton = await within(document.body).findByRole('button', { name: /copied/i });
        await expect(copiedButton).toBeInTheDocument();
    },
};

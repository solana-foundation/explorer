import { address } from '@solana/kit';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClipboardMock, withClipboardMockErrored, withCluster } from '@storybook-config/decorators';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { AddressLink } from '../AddressLink';

const SAMPLE_ADDRESS = address('7bTK6Jis8Xpfrs8ZoUfiMDPazTcdPcTWheZFJTA5Z6X4');

const meta: Meta<typeof AddressLink> = {
    component: AddressLink,
    decorators: [withClipboardMock, withCluster],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/Address/AddressLink',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        address: SAMPLE_ADDRESS,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const link = canvas.getByRole('link');
        await expect(link).toHaveTextContent(SAMPLE_ADDRESS);
        await expect(link.getAttribute('href')?.startsWith('/address/')).toBe(true);
    },
};

export const WithCustomAriaLabel: Story = {
    args: {
        address: SAMPLE_ADDRESS,
        'aria-label': 'Feature gate account',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('link', { name: 'Feature gate account' })).toBeInTheDocument();
    },
};

export const CopyInteraction: Story = {
    args: {
        address: SAMPLE_ADDRESS,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // eslint-disable-next-line no-restricted-syntax -- case-insensitive accessible name match for testing-library query
        const copyButton = canvas.getByRole('button', { name: /copy address/i });
        await userEvent.click(copyButton);

        await expect(navigator.clipboard.writeText).toHaveBeenCalledWith(SAMPLE_ADDRESS);
        // eslint-disable-next-line no-restricted-syntax -- case-insensitive accessible name match for testing-library query
        await expect(canvas.getByRole('button', { name: /copied/i })).toBeInTheDocument();
    },
};

export const Errored: Story = {
    args: {
        address: SAMPLE_ADDRESS,
    },
    decorators: [withClipboardMockErrored],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // eslint-disable-next-line no-restricted-syntax -- case-insensitive accessible name match for testing-library query
        const copyButton = canvas.getByRole('button', { name: /copy address/i });
        await userEvent.click(copyButton);

        await waitFor(() => expect(copyButton.className).toContain('e-text-destructive'));
    },
};

export const InsideTableCell: Story = {
    args: {
        address: SAMPLE_ADDRESS,
    },
    render: args => (
        <div className="e-w-[28rem] e-rounded e-border e-border-heavy-metal-950 e-bg-heavy-metal-800 e-p-3">
            <AddressLink {...args} />
        </div>
    ),
};

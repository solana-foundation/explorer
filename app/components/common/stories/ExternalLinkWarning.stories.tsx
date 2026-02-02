import type { Meta, StoryObj } from '@storybook/react';
import { ExternalLink } from 'react-feather';
import { expect, userEvent, within } from 'storybook/test';

import { ExternalLinkWarning } from '../ExternalLinkWarning';

const meta: Meta<typeof ExternalLinkWarning> = {
    component: ExternalLinkWarning,
    parameters: {
        layout: 'centered',
    },
    title: 'Components/Common/ExternalLinkWarning',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: (
            <span className="text-link align-items-center e-inline-flex">
                Visit External Site
                <ExternalLink className="ms-2" size={13} />
            </span>
        ),
        href: 'https://example.com',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByText('Visit External Site');
        await userEvent.click(trigger);

        const body = within(document.body);
        const dialog = await body.findByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(body.getByText('Leaving Solana Explorer')).toBeInTheDocument();
        expect(body.getByText('https://example.com')).toBeInTheDocument();
    },
};

export const WithSimpleText: Story = {
    args: {
        children: <span className="text-link">Visit External Site</span>,
        href: 'https://example.com',
    },
};

export const WithLongURL: Story = {
    args: {
        children: (
            <span className="text-link align-items-center e-inline-flex">
                View Transaction
                <ExternalLink className="ms-2" size={13} />
            </span>
        ),
        href: 'https://example.example.com/transaction/5wHu1qwD7nMHNuAMQqJWqjy9xKJpVLvJqHxYz6dGfHvM8Zk3pBqRtY2sXwV4uN7mK9jL8iH6gF5eD4cB3aA2zY1x',
    },
};

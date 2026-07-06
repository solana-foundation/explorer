import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { CopyableMonoText, StatusBar } from '../StatusBar';

const meta = {
    component: StatusBar,
    globals: { viewport: { value: 'responsive' } },
    tags: ['autodocs', 'test'],
    title: 'Entities/Program Logs/StatusBar',
} satisfies Meta<typeof StatusBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const date = new Date('2024-01-15T10:30:00Z');
const signature = '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW';
const serializedMessage =
    'AQADByTPMvZ5NhbwY7GzM3bmF6aUB0Es9utyRgN3KoaqxFltNfKjDEAu3mQ7ldMPRzdZ2rwfown8mXJVsLSeFIoWPQObM34V';
const txLink = `/tx/${signature}`;
const inspectorLink = `/tx/inspector?message=${serializedMessage}`;

// Success badge, accent theme, external link present — the success-invocation header.
export const Success: Story = {
    args: {
        badge: { label: 'Success', variant: 'success' },
        date,
        link: txLink,
        theme: 'accent',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('10:30:00 UTC')).toBeInTheDocument();
        expect(canvas.getByText('Success', { exact: false })).toBeInTheDocument();

        const anchor = canvas.getByRole('link');
        expect(anchor).toHaveAttribute('href', txLink);
        expect(anchor).toHaveAttribute('target', '_blank');
    },
};

// Same as Success but with no link — the badge is pushed to the right (no external-link icon).
export const SuccessNoLink: Story = {
    args: {
        badge: { label: 'Success', variant: 'success' },
        date,
        link: undefined,
        theme: 'accent',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Success', { exact: false })).toBeInTheDocument();
        expect(canvas.queryByRole('link')).not.toBeInTheDocument();
    },
};

// Destructive theme + error badge + inspector link, with a copyable serialized message on the left.
export const Error: Story = {
    args: {
        badge: { label: 'Error', variant: 'destructive' },
        date,
        link: inspectorLink,
        message: <CopyableMonoText text={serializedMessage} theme="destructive" />,
        theme: 'destructive',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText(serializedMessage)).toBeInTheDocument();
        expect(canvas.getByText('Error', { exact: false })).toBeInTheDocument();
        expect(canvas.getByRole('link')).toHaveAttribute('href', inspectorLink);
    },
};

// Error with no link (e.g. a local failure with nothing to inspect) — badge is right-aligned.
export const ErrorNoLink: Story = {
    args: {
        badge: { label: 'Error', variant: 'destructive' },
        date,
        link: undefined,
        message: <CopyableMonoText text={serializedMessage} theme="destructive" />,
        theme: 'destructive',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText(serializedMessage)).toBeInTheDocument();
        expect(canvas.getByText('Error', { exact: false })).toBeInTheDocument();
        expect(canvas.queryByRole('link')).not.toBeInTheDocument();
    },
};

// Accent theme with a copyable message present (e.g. a signature) alongside a link.
export const WithMessage: Story = {
    args: {
        badge: { label: 'Success', variant: 'success' },
        date,
        link: txLink,
        message: <CopyableMonoText text={signature} theme="accent" />,
        theme: 'accent',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText(signature)).toBeInTheDocument();
        expect(canvas.getByText('Success', { exact: false })).toBeInTheDocument();
        expect(canvas.getByRole('link')).toHaveAttribute('href', txLink);
    },
};

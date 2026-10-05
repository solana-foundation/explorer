import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { TruncatedValue } from '../TruncatedValue';

const EXAMPLE_HASH = '7039867918bfbbe1aade33c02140c617247df2bb1528f38c66b642a2253c965b';

const meta = {
    component: TruncatedValue,
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/TruncatedValue',
} satisfies Meta<typeof TruncatedValue>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        value: EXAMPLE_HASH,
    },
    decorators: [
        Story => (
            <div style={{ width: 1000 }}>
                <Story />
            </div>
        ),
    ],
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        const [visible] = canvas.getAllByText(EXAMPLE_HASH).filter(el => !el.hasAttribute('aria-hidden'));
        expect(visible).toBeInTheDocument();
    },
};

export const Truncated: Story = {
    args: {
        value: EXAMPLE_HASH,
    },
    decorators: [
        Story => (
            // narrow container should trigger value truncation.
            <div style={{ width: 200 }}>
                <Story />
            </div>
        ),
    ],
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        expect(canvas.getByText('70398…c965b')).toBeInTheDocument();
    },
};

export const TruncatedWithCustomChars: Story = {
    args: {
        truncation: { enabled: true, midTruncateChars: 8 },
        value: EXAMPLE_HASH,
    },
    decorators: [
        Story => (
            <div style={{ width: 200 }}>
                <Story />
            </div>
        ),
    ],
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        expect(canvas.getByText('70398679…253c965b')).toBeInTheDocument();
    },
};

export const Linked: Story = {
    args: {
        href: '/tx/example',
        value: EXAMPLE_HASH,
    },
    decorators: [
        Story => (
            <div style={{ width: 200 }}>
                <Story />
            </div>
        ),
    ],
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        expect(canvas.getByRole('link', { name: EXAMPLE_HASH })).toHaveAttribute('href', '/tx/example');
    },
};

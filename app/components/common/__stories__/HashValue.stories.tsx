import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { HashValue } from '../HashValue';

const EXAMPLE_HASH = '7039867918bfbbe1aade33c02140c617247df2bb1528f38c66b642a2253c965b';

const meta = {
    component: HashValue,
    tags: ['autodocs', 'test'],
    title: 'Components/Common/HashValue',
} satisfies Meta<typeof HashValue>;

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
            // narrow container should trigger hash string truncation.
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

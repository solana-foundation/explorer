import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BaseHighlightNode } from '../BaseHighlightNode';

const meta = {
    component: BaseHighlightNode,
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Formatted IDL/BaseHighlightNode',
} satisfies Meta<typeof BaseHighlightNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
    args: {
        children: 'highlighted text',
        isActive: true,
    },
};

export const Inactive: Story = {
    args: {
        children: 'plain text (rendered without <mark>)',
        isActive: false,
    },
};

export const WithinSentence: Story = {
    args: {
        children: 'fox',
        isActive: true,
    },
    render: args => (
        <p>
            The quick brown <BaseHighlightNode {...args}>fox</BaseHighlightNode> jumps over the lazy dog.
        </p>
    ),
};

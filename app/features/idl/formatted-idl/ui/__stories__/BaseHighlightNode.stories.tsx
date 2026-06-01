import type { Meta, StoryObj } from '@storybook/react';

import { BaseHighlightNode } from '../BaseHighlightNode';

const meta = {
    component: BaseHighlightNode,
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Formatted IDL/UI/BaseHighlightNode',
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
    render: args => (
        <p>
            The quick brown <BaseHighlightNode {...args}>fox</BaseHighlightNode> jumps over the lazy dog.
        </p>
    ),
    args: {
        children: 'fox',
        isActive: true,
    },
};

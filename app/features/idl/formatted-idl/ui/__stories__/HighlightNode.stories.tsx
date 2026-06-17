import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { HighlightNode } from '../HighlightNode';
import { SearchHighlightProvider } from '../SearchHighlightContext';

const meta = {
    component: HighlightNode,
    decorators: [
        (Story, { args }) => (
            <SearchHighlightProvider searchStr={(args as { searchStr?: string }).searchStr ?? ''}>
                <Story />
            </SearchHighlightProvider>
        ),
    ],
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Formatted IDL/HighlightNode',
} satisfies Meta<typeof HighlightNode & { searchStr?: string }>;

export default meta;
type Story = StoryObj<{ searchStr: string; children: React.ReactNode }>;

export const Matched: Story = {
    args: {
        children: 'deposit',
        searchStr: 'deposit',
    },
    render: ({ searchStr: _searchStr, ...args }) => <HighlightNode {...args} />,
};

export const NotMatched: Story = {
    args: {
        children: 'withdraw',
        searchStr: 'deposit',
    },
    render: ({ searchStr: _searchStr, ...args }) => <HighlightNode {...args} />,
};

export const WithoutSearch: Story = {
    args: {
        children: 'nothing to highlight',
        searchStr: '',
    },
    render: ({ searchStr: _searchStr, ...args }) => <HighlightNode {...args} />,
};

export const WithinSentence: Story = {
    args: {
        children: 'deposit',
        searchStr: 'deposit',
    },
    render: ({ searchStr: _searchStr, ...args }) => (
        <p>
            The quick brown <HighlightNode {...args} /> jumps over the lazy dog.
        </p>
    ),
};

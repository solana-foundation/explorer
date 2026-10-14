import type { Meta, StoryObj } from '@storybook-config/types';

import { CodeCard } from '../CodeCard';

const SNIPPET = `claude mcp add --transport http explorer https://explorer.solana.com/mcp`;

const LONG_SNIPPET = Array.from({ length: 12 }, (_, index) => `# instruction line ${index + 1}`).join('\n');

const meta: Meta<typeof CodeCard> = {
    args: { code: SNIPPET, label: 'Shell' },
    component: CodeCard,
    decorators: [
        Story => (
            <div className="max-w-3xl bg-heavy-metal-950 p-6">
                <Story />
            </div>
        ),
    ],
    parameters: { layout: 'padded' },
    tags: ['autodocs', 'test'],
    title: 'Features/McpDocs/CodeCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Collapsible: Story = {
    args: { code: LONG_SNIPPET, collapsible: true, label: 'Agent instructions' },
};

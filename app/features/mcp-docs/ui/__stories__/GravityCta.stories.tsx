import type { Meta, StoryObj } from '@storybook-config/types';

import { GravityCta } from '../GravityCta';

const meta: Meta<typeof GravityCta> = {
    args: { children: 'Give your agent the context', href: '#setup' },
    component: GravityCta,
    decorators: [
        Story => (
            <div className="flex min-h-[280px] items-center justify-center bg-heavy-metal-950 p-10">
                <Story />
            </div>
        ),
    ],
    parameters: { layout: 'fullscreen' },
    tags: ['autodocs', 'test'],
    title: 'Features/McpDocs/GravityCta',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

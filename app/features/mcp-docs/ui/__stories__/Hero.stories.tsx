import type { Meta, StoryObj } from '@storybook-config/types';

import { Hero } from '../Hero';

const meta: Meta<typeof Hero> = {
    args: { origin: 'https://explorer.solana.com' },
    component: Hero,
    parameters: { layout: 'fullscreen' },
    tags: ['autodocs', 'test'],
    title: 'Features/McpDocs/Hero',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {
    args: { status: { ms: 42, state: 'ready' } },
};

export const Checking: Story = {
    args: { status: { state: 'checking' } },
};

export const Disabled: Story = {
    args: { status: { state: 'disabled' } },
};

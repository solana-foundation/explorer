import type { Meta, StoryObj } from '@storybook-config/types';

import { EndpointState } from '../../lib/mcp-docs-layout';
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
    args: { status: { ms: 42, state: EndpointState.Ready } },
};

export const Checking: Story = {
    args: { status: { state: EndpointState.Checking } },
};

export const Disabled: Story = {
    args: { status: { state: EndpointState.Disabled } },
};

export const Restricted: Story = {
    args: { status: { state: EndpointState.Restricted } },
};

export const Blocked: Story = {
    args: { status: { state: EndpointState.Blocked } },
};

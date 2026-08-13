import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, fn, userEvent, within } from 'storybook/test';

import { BaseCodeBlock } from '../BaseCodeBlock';

const MCP_JSON = `{
    "mcpServers": {
        "solana-explorer": {
            "type": "http",
            "url": "https://explorer.solana.com/mcp"
        }
    }
}`;

const ADD_COMMAND = 'claude mcp add --transport http solana-explorer https://explorer.solana.com/mcp';

const meta: Meta<typeof BaseCodeBlock> = {
    component: BaseCodeBlock,
    tags: ['autodocs', 'test'],
    title: 'Shared/CodeBlock/BaseCodeBlock',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        caption: 'Terminal',
        code: ADD_COMMAND,
        onCopy: fn(),
    },
    play: async ({ args, canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Copy code' }));
        await expect(args.onCopy).toHaveBeenCalled();
    },
};

export const Json: Story = {
    args: {
        caption: '.mcp.json',
        code: MCP_JSON,
        onCopy: fn(),
    },
};

export const Copied: Story = {
    args: {
        caption: '.mcp.json',
        code: MCP_JSON,
        copyState: 'copied',
        onCopy: fn(),
    },
};

export const Errored: Story = {
    args: {
        caption: '.mcp.json',
        code: MCP_JSON,
        copyState: 'errored',
        onCopy: fn(),
    },
};

// No handler — the read-only shape server components render.
export const WithoutCopy: Story = {
    args: {
        caption: 'Response',
        code: '{ "payload": { "entity": { "kind": "spl-token:mint" } }, "errors": [] }',
    },
};

export const WrappedLongCommand: Story = {
    args: {
        caption: 'Terminal',
        code: ADD_COMMAND,
        onCopy: fn(),
        wrap: 'wrap',
    },
};

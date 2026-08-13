import { MCP_ENDPOINT_URL, MCP_SERVER_KEY } from './constants';

export interface McpSetupSnippet {
    /** Where the code goes — a config path or `Terminal`. */
    caption: string;
    code: string;
    /** Matches BaseCodeBlock's variant so the value passes straight through. */
    wrap?: 'nowrap' | 'wrap';
}

export interface McpSetupStep {
    description?: string;
    snippet?: McpSetupSnippet;
    title: string;
}

export interface McpSetupClient {
    /** Tab value; kebab-case and unique. */
    id: string;
    label: string;
    steps: readonly McpSetupStep[];
}

// No Authorization header anywhere: production deliberately runs without MCP_ACCESS_KEYS, and a snippet that
// invents a key would send people looking for one that does not exist.
// Non-empty tuple so the tab strip can read `[0]` for its default without an assertion.
export const MCP_SETUP_CLIENTS: readonly [McpSetupClient, ...McpSetupClient[]] = [
    {
        id: 'claude-code',
        label: 'Claude Code',
        steps: [
            {
                snippet: {
                    caption: 'Terminal',
                    code: `claude mcp add --transport http ${MCP_SERVER_KEY} ${MCP_ENDPOINT_URL}`,
                    wrap: 'wrap',
                },
                title: 'Add the server',
            },
            {
                description: 'Commit it to share the server with everyone working on the repository.',
                snippet: {
                    caption: '.mcp.json',
                    code: `{
    "mcpServers": {
        "${MCP_SERVER_KEY}": {
            "type": "http",
            "url": "${MCP_ENDPOINT_URL}"
        }
    }
}`,
                },
                title: 'Or check it into the project',
            },
            {
                description: 'Run /mcp inside Claude Code and confirm the server is connected.',
                title: 'Verify the connection',
            },
        ],
    },
    {
        id: 'cursor',
        label: 'Cursor',
        steps: [
            {
                description: 'Use ~/.cursor/mcp.json for every project, or .cursor/mcp.json for just this one.',
                snippet: {
                    caption: '~/.cursor/mcp.json',
                    code: `{
    "mcpServers": {
        "${MCP_SERVER_KEY}": {
            "url": "${MCP_ENDPOINT_URL}"
        }
    }
}`,
                },
                title: 'Add the server',
            },
            {
                description: 'Open Settings → MCP and confirm the server is listed with its tools.',
                title: 'Verify the connection',
            },
        ],
    },
    {
        id: 'vs-code',
        label: 'VS Code',
        steps: [
            {
                description: 'Note the top-level key is "servers", not "mcpServers".',
                snippet: {
                    caption: '.vscode/mcp.json',
                    code: `{
    "servers": {
        "${MCP_SERVER_KEY}": {
            "type": "http",
            "url": "${MCP_ENDPOINT_URL}"
        }
    }
}`,
                },
                title: 'Add the server',
            },
            {
                description: 'Open the Copilot chat tool picker and confirm the server appears.',
                title: 'Verify the connection',
            },
        ],
    },
    {
        id: 'codex',
        label: 'Codex',
        steps: [
            {
                snippet: {
                    caption: '~/.codex/config.toml',
                    code: `[mcp_servers.${MCP_SERVER_KEY}]
url = "${MCP_ENDPOINT_URL}"`,
                },
                title: 'Add the server',
            },
            {
                description: 'Run codex mcp list and confirm the server is registered.',
                title: 'Verify the connection',
            },
        ],
    },
    {
        id: 'windsurf',
        label: 'Windsurf',
        steps: [
            {
                description: 'Remote servers use "serverUrl" here, not "url".',
                snippet: {
                    caption: '~/.codeium/windsurf/mcp_config.json',
                    code: `{
    "mcpServers": {
        "${MCP_SERVER_KEY}": {
            "serverUrl": "${MCP_ENDPOINT_URL}"
        }
    }
}`,
                },
                title: 'Add the server',
            },
            {
                description: 'Open Cascade → MCP servers and refresh, then confirm the server is listed.',
                title: 'Verify the connection',
            },
        ],
    },
];

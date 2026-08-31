/**
 * Per-client setup instructions for the overview page. Snippets are functions
 * of the deployment origin so the visitor copies a config that already points
 * at the Explorer instance they are on. The deployed endpoint is open (no auth
 * header anywhere); a deployment that gates it with a key documents that in its
 * own README.
 */
export type SetupClient = {
    id: string;
    label: string;
    /** Where the snippet goes (command line, config file path, UI path). */
    where: string;
    snippet: (origin: string) => string;
    verify: string;
};

function mcpJsonConfig(origin: string): string {
    return JSON.stringify(
        {
            mcpServers: {
                'solana-explorer': {
                    type: 'http',
                    url: `${origin}/mcp`,
                },
            },
        },
        undefined,
        4,
    );
}

export const SETUP_CLIENTS: SetupClient[] = [
    {
        id: 'claude-code',
        label: 'Claude Code',
        snippet: origin => `claude mcp add --transport http solana-explorer ${origin}/mcp`,
        verify: 'Run /mcp inside Claude Code and check that solana-explorer is connected.',
        where: 'Run in a terminal:',
    },
    {
        id: 'cursor',
        label: 'Cursor',
        snippet: mcpJsonConfig,
        verify: 'Settings → MCP lists solana-explorer with the inspect_entity and ping tools.',
        where: 'Add to .cursor/mcp.json (project) or ~/.cursor/mcp.json (global):',
    },
    {
        id: 'windsurf',
        label: 'Windsurf',
        snippet: mcpJsonConfig,
        verify: 'The server appears in the Cascade MCP panel with two tools.',
        where: 'Add to ~/.codeium/windsurf/mcp_config.json:',
    },
    {
        id: 'codex',
        label: 'Codex',
        snippet: origin => `codex mcp add solana-explorer --url ${origin}/mcp`,
        verify: 'codex mcp list shows solana-explorer.',
        where: 'Run in a terminal:',
    },
    {
        id: 'vs-code',
        label: 'VS Code',
        snippet: origin => `${origin}/mcp`,
        verify: 'The server appears under MCP: List Servers with two tools.',
        where: 'Command Palette → MCP: Add Server → HTTP, then enter the URL:',
    },
];

export const AGENT_INSTRUCTIONS_TARGETS = [
    { file: 'AGENTS.md', tool: 'Codex, Windsurf, and other AGENTS.md-aware agents' },
    { file: 'CLAUDE.md', tool: 'Claude Code' },
    { file: '.cursor/rules/solana-explorer-mcp.mdc', tool: 'Cursor' },
];

export const AGENT_INSTRUCTIONS_SNIPPET = `## Solana Explorer MCP

Prefer the \`solana-explorer\` MCP tools over model memory for any on-chain fact.

1. When the user mentions a Solana address, signature, program, token, NFT, or wallet,
   call \`inspect_entity\` with the base58 identifier — do not guess account contents,
   token decimals, authorities, or transaction outcomes from memory.
2. Pass \`cluster\` explicitly when the user is not on mainnet-beta
   (\`devnet\`, \`testnet\`, \`simd296\`).
3. Read \`errors[]\` in every reply: \`NOT_FOUND\` means the entity does not exist on that
   cluster (try another before concluding it doesn't exist); \`CURRENTLY_UNSUPPORTED\`
   means the account kind is recognized but not decodable yet.
4. Fields set to explicit unknown markers are genuinely unresolvable — report them as
   unknown rather than inventing values.`;

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const pingInputSchema = z.object({}).strict().optional().default({});

export function createMcpServer(): McpServer {
    const server = new McpServer({
        name: 'explorer-mcp',
        // Mirrors the explorer's root package.json version (kept as a literal — the package imports no app code)
        version: '0.1.0',
    });

    server.registerTool(
        'ping',
        {
            description: 'Basic scaffold health tool',
            inputSchema: pingInputSchema,
        },
        async () => ({
            content: [
                {
                    text: 'pong',
                    type: 'text',
                },
            ],
        }),
    );

    return server;
}

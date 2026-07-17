// @vitest-environment node
import { describe, expect, it } from 'vitest';

import type { EntityInspectorConfig } from '../../types.js';
import { createMcpRequestHandler } from '../handler.js';

const TEST_CONFIG: EntityInspectorConfig = {
    rpcEndpoints: {
        devnet: 'https://api.devnet.solana.com',
        'mainnet-beta': 'https://api.mainnet-beta.solana.com',
        simd296: 'https://simd-0296.surfnet.dev:8899',
        testnet: 'https://api.testnet.solana.com',
    },
};

const PROTOCOL_VERSION = '2025-11-05';

const MCP_HEADERS = {
    accept: 'application/json, text/event-stream',
    'content-type': 'application/json',
};

function initializeRequest(id: number): Request {
    return mcpRequest(
        'initialize',
        {
            capabilities: {},
            clientInfo: { name: 'vitest-client', version: '0.1.0' },
            protocolVersion: PROTOCOL_VERSION,
        },
        id,
    );
}

function mcpRequest(
    method: string,
    params: Record<string, unknown>,
    id: number,
    headers: Record<string, string> = MCP_HEADERS,
): Request {
    return new Request('http://localhost/mcp', {
        body: JSON.stringify({ id, jsonrpc: '2.0', method, params }),
        headers,
        method: 'POST',
    });
}

// Stateless transport: negotiate the protocol version once, then send it with every tool request.
async function negotiatedToolRequest(
    handler: ReturnType<typeof createMcpRequestHandler>,
    method: string,
    params: Record<string, unknown>,
    id: number,
): Promise<Request> {
    const initResponse = await handler(initializeRequest(0));
    const initPayload = await initResponse.json();
    return mcpRequest(method, params, id, {
        ...MCP_HEADERS,
        'mcp-protocol-version': initPayload.result.protocolVersion,
    });
}

describe('createMcpRequestHandler', () => {
    const handler = createMcpRequestHandler(TEST_CONFIG);

    it('should respond to initialize with the server identity', async () => {
        const response = await handler(initializeRequest(1));

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            id: 1,
            jsonrpc: '2.0',
            result: { serverInfo: { name: 'explorer-mcp', version: '0.1.0' } },
        });
    });

    it('should list the ping tool', async () => {
        const response = await handler(await negotiatedToolRequest(handler, 'tools/list', {}, 2));

        expect(response.status).toBe(200);
        const payload = await response.json();
        expect(payload.result.tools).toMatchObject([{ name: 'ping' }]);
    });

    it('should answer a ping tool call with pong', async () => {
        const response = await handler(
            await negotiatedToolRequest(handler, 'tools/call', { arguments: {}, name: 'ping' }, 3),
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            id: 3,
            jsonrpc: '2.0',
            result: { content: [{ text: 'pong', type: 'text' }] },
        });
    });
});

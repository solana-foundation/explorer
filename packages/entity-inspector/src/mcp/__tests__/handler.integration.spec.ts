// @vitest-environment node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { LATEST_PROTOCOL_VERSION } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
            protocolVersion: LATEST_PROTOCOL_VERSION,
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

describe('createMcpRequestHandler — real MCP SDK transport', () => {
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

// Spy (not vi.mock) so these close-failure cases can share a file with the round-trips above.
describe('createMcpRequestHandler — real MCP SDK transport, close failures', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should log both close failures via the injected logger and still return the response', async () => {
        vi.spyOn(WebStandardStreamableHTTPServerTransport.prototype, 'close').mockRejectedValue(
            new Error('transport boom'),
        );
        vi.spyOn(McpServer.prototype, 'close').mockRejectedValue(new Error('server boom'));
        const warn = vi.fn();
        const handler = createMcpRequestHandler({
            logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn },
            rpcEndpoints: TEST_CONFIG.rpcEndpoints,
        });

        const response = await handler(initializeRequest(1));

        expect(response.status).toBe(200);
        expect(warn).toHaveBeenCalledWith('[entity-inspector] transport close failed', { error: expect.any(Error) });
        expect(warn).toHaveBeenCalledWith('[entity-inspector] server close failed', { error: expect.any(Error) });
    });
});

import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';

import { consoleLogger } from '../logger.js';
import type { EntityInspectorConfig } from '../types.js';
import { createMcpServer } from './server.js';

export type McpRequestHandler = (request: Request) => Promise<Response>;

/** Stateless transport: a fresh server + transport pair per request, both closed in `finally`. */
export function createMcpRequestHandler(config: EntityInspectorConfig): McpRequestHandler {
    const logger = config.logger ?? consoleLogger;
    return async request => {
        const server = createMcpServer();
        const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
        try {
            await server.connect(transport);
            return await transport.handleRequest(request);
        } finally {
            await transport.close().catch(error => logger.warn('[entity-inspector] transport close failed', { error }));
            await server.close().catch(error => logger.warn('[entity-inspector] server close failed', { error }));
        }
    };
}

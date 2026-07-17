import type { EntityInspectorConfig, McpRequestHandler } from '@explorer/entity-inspector';
import { clusterApiUrl } from '@solana/web3.js';

import { Logger } from '@/app/shared/lib/logger';

const logger: EntityInspectorConfig['logger'] = {
    debug: (message, context) => Logger.debug(message, context),
    info: (message, context) => Logger.info(message, context),
    warn: (message, context) => Logger.warn(message, context),
};

// Dedicated MCP RPC endpoints — separate quota/provider from the app's RPC; public endpoints as fallback.
// Resolved at request time (not module scope) so the key-bearing URLs are read from the Vercel runtime
// env and never baked into a build artifact.
function resolveRpcEndpoints(): EntityInspectorConfig['rpcEndpoints'] {
    return {
        devnet: process.env.MCP_SOLANA_RPC_URL_DEVNET || clusterApiUrl('devnet'),
        'mainnet-beta': process.env.MCP_SOLANA_RPC_URL_MAINNET_BETA || clusterApiUrl('mainnet-beta'),
        // simd296 is not a web3.js cluster, so its public endpoint stays a literal
        simd296: process.env.MCP_SOLANA_RPC_URL_SIMD296 || 'https://simd-0296.surfnet.dev:8899',
        testnet: process.env.MCP_SOLANA_RPC_URL_TESTNET || clusterApiUrl('testnet'),
    };
}

let handlerPromise: Promise<McpRequestHandler> | undefined;

/** Imports the MCP package lazily so a disabled endpoint never loads it. */
export function getMcpRequestHandler(): Promise<McpRequestHandler> {
    handlerPromise = handlerPromise ?? importRequestHandler();
    return handlerPromise;
}

async function importRequestHandler(): Promise<McpRequestHandler> {
    const { createMcpRequestHandler } = await import('@explorer/entity-inspector');
    return createMcpRequestHandler({ logger, rpcEndpoints: resolveRpcEndpoints() });
}

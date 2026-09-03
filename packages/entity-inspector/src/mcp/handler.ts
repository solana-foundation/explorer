import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';

import { SUPPORTED_CLUSTERS } from '../config.js';
import { consoleLogger, ns } from '../logger.js';
import { toLoggedError } from '../shared/logged-error.js';
import { createMultisigResolver } from '../enrichments/multisig.js';
import { createSecurityMetadataResolver } from '../enrichments/security.js';
import { createVerificationResolver } from '../enrichments/verification.js';
import { createIdlClientResolver, createProgramIdlDiscovery } from '../enrichments/idl-clients.js';
import { createRpcClient } from '../rpc/rpc.js';
import type { EntityInspectorConfig } from '../types.js';
import { createMcpServer } from './server.js';
import type { InspectEntityDependencies } from './tools/inspect-entity.js';

export type McpRequestHandler = (request: Request) => Promise<Response>;

/**
 * Stateless transport: a fresh server + transport pair per request, both closed in `finally`.
 *
 * @throws if an enabled cluster has no RPC endpoint — a misconfiguration that would otherwise fail per tool call.
 */
export function createMcpRequestHandler(config: EntityInspectorConfig): McpRequestHandler {
    const logger = config.logger ?? consoleLogger;
    for (const cluster of config.enabledClusterNames ?? SUPPORTED_CLUSTERS) {
        const endpoint = config.rpcEndpoints[cluster];
        if (!endpoint) {
            throw new Error(ns(`enabledClusterNames lists ${cluster} but rpcEndpoints has no endpoint for it`));
        }
        // Names the cluster, never the endpoint: undici reports an unparseable one as
        // `Failed to parse URL from <url>`, which puts a key-bearing URL straight into the logs.
        if (!URL.canParse(endpoint)) {
            throw new Error(ns(`rpcEndpoints[${cluster}] is not a valid URL`));
        }
    }
    const rpcClient = createRpcClient(config.rpcEndpoints);
    const resolveIdlClient = createIdlClientResolver(config.rpcEndpoints, logger);
    const dependencies: InspectEntityDependencies = {
        discoverProgramIdl: createProgramIdlDiscovery(config.rpcEndpoints, logger),
        fetchAccountInfo: rpcClient.fetchAccountInfo,
        fetchAsset: rpcClient.fetchAsset,
        fetchSignatureStatus: rpcClient.fetchSignatureStatus,
        fetchTransaction: rpcClient.fetchTransaction,
        logger,
        resolveIdlClient,
        resolveMultisigReference: createMultisigResolver({ fetchAccountInfo: rpcClient.fetchAccountInfo, logger }),
        resolveProgramVerification: createVerificationResolver({
            fetchAccountInfo: rpcClient.fetchAccountInfo,
            logger,
            resolveIdlClient,
        }),
        resolveSecurityMetadata: createSecurityMetadataResolver(config.rpcEndpoints, logger),
        ...(config.enabledClusterNames ? { enabledClusterNames: config.enabledClusterNames } : {}),
        ...(config.decodeInstructionFallback ? { decodeInstructionFallback: config.decodeInstructionFallback } : {}),
        ...(config.resolveProgramName ? { resolveProgramName: config.resolveProgramName } : {}),
        ...(config.track ? { track: config.track } : {}),
    };
    const { wrapServer } = config;
    return async request => {
        const baseServer = createMcpServer(dependencies);
        const server = wrapServer ? wrapServer(baseServer) : baseServer;
        const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
        try {
            await server.connect(transport);
            return await transport.handleRequest(request);
        } finally {
            await transport
                .close()
                .catch(error => logger.warn(ns('transport close failed'), { error: toLoggedError(error) }));
            await server
                .close()
                .catch(error => logger.warn(ns('server close failed'), { error: toLoggedError(error) }));
        }
    };
}

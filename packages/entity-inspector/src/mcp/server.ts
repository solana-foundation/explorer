import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { defaultCluster, type EnabledClusterNames, SUPPORTED_CLUSTERS } from '../config.js';
import { consoleLogger, ns } from '../logger.js';
import { buildToolCallEvent } from './analytics-event.js';
import { internalError, toToolResult } from './errors.js';
import { inspectEntityInputSchema, pingInputSchema } from './schemas.js';
import { handleInspectEntity, type InspectEntityDependencies } from './tools/inspect-entity.js';

// Built per server so the CLUSTER line names the deployment's enabled set rather than every cluster the package knows.
const buildInspectEntityDescription = (clusterNames: EnabledClusterNames) =>
    [
        'Retrieve detailed on-chain data for any Solana account.',
        'Use this tool when a user asks about a Solana address, program, token, NFT, wallet, or other blockchain entity.',
        '',
        'IDENTIFIER: A base58-encoded string. Accepts account addresses (32-byte) and transaction signatures (64-byte) — the tool detects which type was provided.',
        '',
        `CLUSTER: Solana network to query (${clusterNames.join(', ')}). Defaults to ${defaultCluster(clusterNames)}.`,
        '',
        'ACCOUNT TYPES RETURNED (by entity.kind):',
        '- "spl-token:mint" / "spl-token-2022:mint": Token mints — address, supply, decimals, mint/freeze authorities, supply type (fixed/variable), token program. Token-2022 mints also include parsed extensions.',
        '- "spl-token:account" / "spl-token-2022:account": Token accounts — mint, owner, token program.',
        '- "spl-token:multisig" / "spl-token-2022:multisig": Token multisigs — signers, threshold, initialization status.',
        '- "compressed-nft": Compressed NFTs — asset ID, owner, merkle tree.',
        '- "stake", "vote", "nonce", "sysvar", "config", "address-lookup-table", "feature", "native-program", "nftoken", "solana-attestation-service": Recognized system account types.',
        '- "bpf-upgradeable-loader": Upgradeable programs — address, label, balance, executable-data account, upgradeability ("upgradeable": false means the program is frozen: its upgrade authority is revoked and its code can no longer change), last deploy slot, upgrade authority, plus "idl", "verification" (verified-build status), "security_metadata" (security.txt) and "multisig" (upgrade-authority multisig) enrichments. Each carries an explicit unknown marker when its source is unavailable.',
        '  The "idl" enrichment reports status, idl_type, program name, "source" ("pmp" for the program-metadata program, "anchor" for the Anchor IDL PDA) and "source_type", which refines it: "pmp_canonical" (the program\'s own PDA), "pmp_fallback" (a fallback authority\'s PDA — the only place a frozen program\'s IDL can live, since nobody can write its canonical one) or "anchor". A PMP result also carries "authority": null when canonical, else the key whose PDA served it.',
        '  Note "verification.evidence.is_frozen" is registry metadata recorded when the build was attested, so it can disagree with the current on-chain state; "upgradeable" is read live.',
        '- "bpf-loader" / "bpf-loader-2" / "loader-v4": Legacy-loader programs — currently unsupported; return a CURRENTLY_UNSUPPORTED error.',
        '- "unknown": Unrecognized account type. When the owner program publishes an IDL, the account data is decoded through it and returned as "decoded" (source "idl").',
        '',
        'TRANSACTIONS: 64-byte signatures return entity.kind "transaction" — slot, block time, fee, status, error, signers, accounts (v0 lookup-table addresses attributed via source/lookupTableAddress), and instructions with inner instructions. Instructions decode through a cascade: programs publishing an on-chain IDL carry "decoded" with source "idl"; token batch and host-app-supported programs decode with source "bundled"; the rest stay base58 with source "raw".',
        '',
        'OUTPUT: Responses use { payload: { entity: { kind, ...fields } }, errors: [] }. Unresolvable fields return explicit unknown markers instead of being silently omitted.',
    ].join('\n');

// A throwing sink must never break the tool reply — telemetry is strictly best-effort.
function withToolTracking<TInput>(
    tool: string,
    dependencies: InspectEntityDependencies,
    handler: (input: TInput) => Promise<CallToolResult>,
): (input: TInput) => Promise<CallToolResult> {
    const { track } = dependencies;
    if (!track) {
        return handler;
    }
    const logger = dependencies.logger ?? consoleLogger;
    return async input => {
        const started = Date.now();
        const result = await handler(input);
        try {
            track(buildToolCallEvent(tool, input, result, Date.now() - started));
        } catch (error) {
            logger.warn(ns('analytics track failed'), { error, tool });
        }
        return result;
    };
}

// The SDK returns an uncaught error's `message` to the client verbatim, and RPC failures can carry the key-bearing endpoint.
function withErrorGuard<TInput>(
    tool: string,
    dependencies: InspectEntityDependencies,
    handler: (input: TInput) => Promise<CallToolResult>,
): (input: TInput) => Promise<CallToolResult> {
    const logger = dependencies.logger ?? consoleLogger;
    return async input => {
        try {
            return await handler(input);
        } catch (error) {
            logger.error(ns(`${tool} failed`), { error });
            return toToolResult({ errors: [internalError()], payload: {} });
        }
    };
}

// Read off `dependencies` rather than taken separately, so the advertised enum and the handler's own parse cannot diverge.
export function createMcpServer(dependencies: InspectEntityDependencies): McpServer {
    const enabledClusterNames: EnabledClusterNames = dependencies.enabledClusterNames ?? SUPPORTED_CLUSTERS;
    const server = new McpServer({
        name: 'explorer-mcp',
        // Mirrors the explorer's root package.json version (kept as a literal — the package imports no app code)
        version: '0.1.0',
    });

    const { track } = dependencies;
    if (track) {
        const logger = dependencies.logger ?? consoleLogger;
        server.server.oninitialized = () => {
            try {
                track({ name: 'mcp_initialize', params: {} });
            } catch (error) {
                logger.warn(ns('analytics track failed'), { error, tool: 'initialize' });
            }
        };
    }

    server.registerTool(
        'inspect_entity',
        {
            annotations: {
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
                readOnlyHint: true,
                title: 'Inspect Solana Entity',
            },
            description: buildInspectEntityDescription(enabledClusterNames),
            inputSchema: inspectEntityInputSchema(enabledClusterNames),
            title: 'Inspect Solana Entity',
        },
        withToolTracking(
            'inspect_entity',
            dependencies,
            withErrorGuard('inspect_entity', dependencies, async input => handleInspectEntity(input, dependencies)),
        ),
    );

    server.registerTool(
        'ping',
        {
            description: 'Basic scaffold health tool',
            inputSchema: pingInputSchema(),
        },
        withToolTracking('ping', dependencies, async () => ({
            content: [
                {
                    text: 'pong',
                    type: 'text',
                },
            ],
        })),
    );

    return server;
}

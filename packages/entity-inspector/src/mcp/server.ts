import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { inspectEntityInputSchema, pingInputSchema } from './schemas.js';
import { handleInspectEntity, type InspectEntityDependencies } from './tools/inspect-entity.js';

const INSPECT_ENTITY_DESCRIPTION = [
    'Retrieve detailed on-chain data for any Solana account.',
    'Use this tool when a user asks about a Solana address, program, token, NFT, wallet, or other blockchain entity.',
    '',
    'IDENTIFIER: A base58-encoded string. Accepts account addresses (32-byte) and transaction signatures (64-byte) — the tool detects which type was provided.',
    '',
    'CLUSTER: Solana network to query (mainnet-beta, devnet, testnet, simd296). Defaults to mainnet-beta.',
    '',
    'ACCOUNT TYPES RETURNED (by entity.kind):',
    '- "spl-token:mint" / "spl-token-2022:mint": Token mints — address, supply, decimals, mint/freeze authorities, supply type (fixed/variable), token program. Token-2022 mints also include parsed extensions.',
    '- "spl-token:account" / "spl-token-2022:account": Token accounts — mint, owner, token program.',
    '- "spl-token:multisig" / "spl-token-2022:multisig": Token multisigs — signers, threshold, initialization status.',
    '- "compressed-nft": Compressed NFTs — asset ID, owner, merkle tree.',
    '- "stake", "vote", "nonce", "sysvar", "config", "address-lookup-table", "feature", "nftoken", "solana-attestation-service": Recognized system account types.',
    '- "bpf-upgradeable-loader" / "bpf-loader" / "bpf-loader-2" / "loader-v4": Executable programs — currently unsupported; return a CURRENTLY_UNSUPPORTED error until IDL-based enrichment lands.',
    '- "unknown": Unrecognized account type.',
    '',
    'TRANSACTIONS: not supported yet — 64-byte signatures return a CURRENTLY_UNSUPPORTED error.',
    '',
    'OUTPUT: Responses use { payload: { entity: { kind, ...fields } }, errors: [] }. Unresolvable fields return explicit unknown markers instead of being silently omitted.',
].join('\n');

export function createMcpServer(dependencies: InspectEntityDependencies): McpServer {
    const server = new McpServer({
        name: 'explorer-mcp',
        // Mirrors the explorer's root package.json version (kept as a literal — the package imports no app code)
        version: '0.1.0',
    });

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
            description: INSPECT_ENTITY_DESCRIPTION,
            inputSchema: inspectEntityInputSchema(),
            title: 'Inspect Solana Entity',
        },
        async input => handleInspectEntity(input, dependencies),
    );

    server.registerTool(
        'ping',
        {
            description: 'Basic scaffold health tool',
            inputSchema: pingInputSchema(),
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

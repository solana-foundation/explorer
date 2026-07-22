import type { EntityInspectorConfig, McpRequestHandler } from '@explorer/entity-inspector';
import { isParsedInstruction } from '@explorer/parsers';
import { getBase58Encoder } from '@solana/kit';
import { clusterApiUrl, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Logger } from '@/app/shared/lib/logger';
import { instructionParserDispatcher } from '@/app/tx/instruction-parser-dispatcher';
import { LOADER_IDS, PROGRAM_INFO_BY_ID } from '@/app/utils/programs';

const resolveProgramName: EntityInspectorConfig['resolveProgramName'] = address =>
    PROGRAM_INFO_BY_ID[address]?.name ?? LOADER_IDS[address];

const decodeInstructionFallback: EntityInspectorConfig['decodeInstructionFallback'] = instruction => {
    const dispatched = instructionParserDispatcher.fromTransactionInstruction(
        new TransactionInstruction({
            data: Buffer.from(getBase58Encoder().encode(instruction.data)),
            keys: instruction.accounts.map(account => ({
                isSigner: account.signer,
                isWritable: account.writable,
                pubkey: new PublicKey(account.address),
            })),
            programId: new PublicKey(instruction.programId),
        }),
    );
    if (!isParsedInstruction(dispatched)) {
        return undefined;
    }
    // Parser info carries PublicKey/BN instances; the wire format needs their JSON forms.
    return {
        info: JSON.parse(JSON.stringify(dispatched.parsed.info)),
        program: dispatched.program,
        type: dispatched.parsed.type,
    };
};

const logger: EntityInspectorConfig['logger'] = {
    debug: (message, context) => Logger.debug(message, context),
    // Wrap in Error: Logger.error replaces a bare string with a sentinel, losing the message in Sentry.
    error: (message, context) => Logger.error(new Error(message), context),
    info: (message, context) => Logger.info(message, context),
    warn: (message, context) => Logger.warn(message, context),
};

// Resolved at handler init (cold start), not module scope, so key-bearing URLs come from runtime env, never a build artifact.
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

/** Lazy so a disabled endpoint never loads the MCP package. */
export function getMcpRequestHandler(): Promise<McpRequestHandler> {
    if (!handlerPromise) {
        handlerPromise = importRequestHandler().catch(error => {
            // Clear the cache on failure so a transient import error isn't stuck until redeploy.
            handlerPromise = undefined;
            throw error;
        });
    }
    return handlerPromise;
}

async function importRequestHandler(): Promise<McpRequestHandler> {
    const { createMcpRequestHandler } = await import('@explorer/entity-inspector');
    return createMcpRequestHandler({
        decodeInstructionFallback,
        logger,
        resolveProgramName,
        rpcEndpoints: resolveRpcEndpoints(),
    });
}

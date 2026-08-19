// The per-instruction decode cascade: in-package token batch → on-chain IDL → bundled
// @explorer/parsers decoders → injected host-app fallback → raw, with source attribution.
import { type IdlClient, IdlStandard } from '@explorer/idl-decode';

import { type InspectorLogger, ns } from '../logger.js';
import type { CompiledInstruction } from '../rpc/types.js';
import type {
    DecodedInstructionInfo,
    DecodedInstructionSource,
    DecodeInstructionFallback,
    FallbackInstruction,
    TransactionInstructionEntry,
    TransactionPayloadContext,
} from './types.js';
import { decodeBundledInstruction } from './bundled-parsers.js';
import { decodeTokenBatchInstruction } from './token-batch.js';
import { toKitInstruction } from './to-kit-instruction.js';
import { toTokenUiAmount } from './token-ui-amount.js';

export type DecodeInstructionsDependencies = {
    decodeInstructionFallback?: DecodeInstructionFallback;
    logger: InspectorLogger;
    /** Cluster-bound IDL resolver — resolves `null` on any failure, never rejects. */
    resolveIdlClient?: (programAddress: string) => Promise<IdlClient | null>;
};

function resolveAccount<T>(index: number, entries: readonly T[]): T {
    const entry = entries[index];
    if (entry === undefined) {
        throw new Error(`account index ${index} out of bounds for ${entries.length} keys`);
    }
    return entry;
}

type DecodeOutcome = {
    source: DecodedInstructionSource;
    decoded?: DecodedInstructionInfo;
};

// The codama engine pairs every on-wire account with the name the IDL declares for it; anything past
// the declared list (a multisig's extra signers) stays positional in the entry's own `accounts`.
function toNamedAccounts(accounts: readonly { address: string; name: string }[]): Record<string, string> {
    return Object.fromEntries(accounts.map(account => [account.name, account.address]));
}

function decodeWithIdlClient(instruction: FallbackInstruction, client: IdlClient): DecodedInstructionInfo | undefined {
    const kitInstruction = toKitInstruction(instruction);
    // two-step: the envelope carries the engine's account naming, which decodeInstructionData drops
    const decode = client.decodeInstruction(kitInstruction);
    if (decode.kind === 'unknown') {
        return undefined;
    }
    const info = client.getDecodedData(decode);
    const program = client.programName();
    // Gated on a non-empty list: an IDL naming no accounts (every ComputeBudget instruction) would
    // otherwise ship an empty map on nearly every transaction, saying nothing that absence does not.
    const named =
        decode.kind === IdlStandard.Codama && decode.decoded.accounts.length > 0
            ? toNamedAccounts(decode.decoded.accounts)
            : undefined;
    const uiAmount = toTokenUiAmount(instruction.programId, info);
    return {
        info,
        type: client.instructionName(kitInstruction.data) ?? 'unknown',
        ...(program !== undefined ? { program } : {}),
        ...(named ? { accounts: named } : {}),
        ...(uiAmount !== undefined ? { ui_amount: uiAmount } : {}),
    };
}

function runDecodeCascade(
    instruction: FallbackInstruction,
    dependencies: DecodeInstructionsDependencies,
    idlClients: ReadonlyMap<string, IdlClient>,
): DecodeOutcome {
    // Ahead of the IDL rung: Tokenkeg's published IDL declares batch as one opaque `data` blob, so an
    // IDL-first order would drop the sub-instruction expansion. Self-gating — non-batch returns undefined.
    try {
        const batchDecoded = decodeTokenBatchInstruction(instruction);
        if (batchDecoded) {
            return { decoded: batchDecoded, source: 'bundled' };
        }
    } catch (error) {
        dependencies.logger.warn(ns('token batch instruction decode failed'), {
            error,
            programId: instruction.programId,
        });
    }

    const idlClient = idlClients.get(instruction.programId);
    if (idlClient) {
        try {
            const idlDecoded = decodeWithIdlClient(instruction, idlClient);
            if (idlDecoded) {
                return { decoded: idlDecoded, source: 'idl' };
            }
        } catch (error) {
            dependencies.logger.warn(ns('idl instruction decode failed'), {
                error,
                programId: instruction.programId,
            });
        }
    }

    try {
        const bundledDecoded = decodeBundledInstruction(instruction);
        if (bundledDecoded) {
            return { decoded: bundledDecoded, source: 'bundled' };
        }
    } catch (error) {
        dependencies.logger.warn(ns('bundled instruction decode failed'), {
            error,
            programId: instruction.programId,
        });
    }

    if (dependencies.decodeInstructionFallback) {
        try {
            const fallbackDecoded = dependencies.decodeInstructionFallback(instruction);
            if (fallbackDecoded) {
                return { decoded: fallbackDecoded, source: 'bundled' };
            }
        } catch (error) {
            dependencies.logger.warn(ns('fallback instruction decode failed'), {
                error,
                programId: instruction.programId,
            });
        }
    }

    return { source: 'raw' };
}

// One resolution per unique program per transaction; the resolver contract makes failures nulls,
// so Promise.all carries allSettled semantics without the ceremony.
async function resolveIdlClients(
    context: TransactionPayloadContext,
    dependencies: DecodeInstructionsDependencies,
): Promise<ReadonlyMap<string, IdlClient>> {
    const { resolveIdlClient } = dependencies;
    if (!resolveIdlClient) {
        return new Map();
    }

    const compiled = [
        ...context.instructions,
        ...(context.innerInstructions ?? []).flatMap(group => group.instructions),
    ];
    const programIds = new Set(compiled.map(ix => resolveAccount(ix.programIdIndex, context.accountKeys)));

    const clients = new Map<string, IdlClient>();
    await Promise.all(
        [...programIds].map(async programId => {
            const client = await resolveIdlClient(programId);
            if (client) {
                clients.set(programId, client);
            }
        }),
    );
    return clients;
}

/**
 * Resolves compiled instruction indices to addresses and runs the decode cascade on every outer and
 * inner instruction. Account indices are pre-validated by the normalizer; the bounds throw here only
 * guards direct misuse.
 */
export async function decodeTransactionInstructions(
    context: TransactionPayloadContext,
    dependencies: DecodeInstructionsDependencies,
): Promise<TransactionInstructionEntry[]> {
    const { accountKeys, resolvedAccounts, instructions, innerInstructions } = context;
    const idlClients = await resolveIdlClients(context, dependencies);

    function decodeEntry(ix: CompiledInstruction) {
        const fallbackInstruction: FallbackInstruction = {
            // resolvedAccounts is index-aligned with accountKeys — same order, roles attached.
            accounts: ix.accounts.map(index => {
                const { address, signer, writable } = resolveAccount(index, resolvedAccounts);
                return { address, signer, writable };
            }),
            data: ix.data,
            programId: resolveAccount(ix.programIdIndex, accountKeys),
        };
        const { decoded, source } = runDecodeCascade(fallbackInstruction, dependencies, idlClients);
        return {
            accounts: fallbackInstruction.accounts.map(account => account.address),
            data: ix.data,
            program_id: fallbackInstruction.programId,
            source,
            ...(decoded ? { decoded } : {}),
        };
    }

    const innerMap = new Map<number, readonly CompiledInstruction[]>();
    for (const group of innerInstructions ?? []) {
        const existing = innerMap.get(group.index);
        innerMap.set(group.index, existing ? [...existing, ...group.instructions] : group.instructions);
    }

    return instructions.map((ix, i) => ({
        ...decodeEntry(ix),
        inner_instructions: (innerMap.get(i) ?? []).map(decodeEntry),
    }));
}

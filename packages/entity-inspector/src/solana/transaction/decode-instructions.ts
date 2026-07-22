// The per-instruction decode cascade (D7): in-package token batch → bundled @explorer/parsers
// decoders → injected host-app fallback → raw, with source attribution. The IDL rung lands with the
// @explorer/idl-decode wiring.
import type { InspectorLogger } from '../../logger.js';
import type {
    CompiledInstruction,
    DecodedInstructionInfo,
    DecodedInstructionSource,
    DecodeInstructionFallback,
    FallbackInstruction,
    TransactionInstructionEntry,
    TransactionPayloadContext,
} from '../types.js';
import { decodeBundledInstruction } from './bundled-parsers.js';
import { decodeTokenBatchInstruction } from './token-batch.js';

export type DecodeInstructionsDependencies = {
    decodeInstructionFallback?: DecodeInstructionFallback;
    logger: InspectorLogger;
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

function runDecodeCascade(
    instruction: FallbackInstruction,
    dependencies: DecodeInstructionsDependencies,
): DecodeOutcome {
    try {
        const batchDecoded = decodeTokenBatchInstruction(instruction);
        if (batchDecoded) {
            return { decoded: batchDecoded, source: 'bundled' };
        }
    } catch (error) {
        dependencies.logger.warn('[entity-inspector] token batch instruction decode failed', {
            error,
            programId: instruction.programId,
        });
    }

    try {
        const bundledDecoded = decodeBundledInstruction(instruction);
        if (bundledDecoded) {
            return { decoded: bundledDecoded, source: 'bundled' };
        }
    } catch (error) {
        dependencies.logger.warn('[entity-inspector] bundled instruction decode failed', {
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
            dependencies.logger.warn('[entity-inspector] fallback instruction decode failed', {
                error,
                programId: instruction.programId,
            });
        }
    }

    return { source: 'raw' };
}

/**
 * Resolves compiled instruction indices to addresses and runs the decode cascade on every outer and
 * inner instruction. Account indices are pre-validated by the normalizer; the bounds throw here only
 * guards direct misuse.
 */
export function decodeTransactionInstructions(
    context: TransactionPayloadContext,
    dependencies: DecodeInstructionsDependencies,
): TransactionInstructionEntry[] {
    const { accountKeys, resolvedAccounts, instructions, innerInstructions } = context;

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
        const { decoded, source } = runDecodeCascade(fallbackInstruction, dependencies);
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

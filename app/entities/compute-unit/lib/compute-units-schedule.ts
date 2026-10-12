import {
    type BlockTransaction,
    getBlockTransactionConfig,
    getBlockTransactionInstructions,
} from '@entities/block-data/@x/compute-unit';
import {
    getReservedComputeUnits as getPackageReservedComputeUnits,
    MAX_COMPUTE_UNITS,
} from '@explorer/parsers/programs/compute-budget';
import { type Address, address, getBase58Encoder } from '@solana/kit';
import { type ParsedInstruction, type PartiallyDecodedInstruction } from '@solana/web3.js';
import {
    COMPUTE_BUDGET_PROGRAM_ADDRESS,
    ComputeBudgetInstruction,
    identifyComputeBudgetInstruction,
    parseRequestUnitsInstruction,
    parseSetComputeUnitLimitInstruction,
} from '@solana-program/compute-budget';
import type { Cluster } from '@utils/cluster';

import { toScheduleCluster } from './cluster';

const BASE58_ENCODER = getBase58Encoder();

/** `Uses the app's `Cluster` enum and a string program id, so callers do not need to perform any conversions themselves. */
export function getReservedComputeUnits({
    programId,
    epoch,
    cluster,
}: {
    programId: string;
    epoch?: bigint;
    cluster: Cluster;
}): number {
    return getPackageReservedComputeUnits({
        cluster: toScheduleCluster(cluster),
        epoch,
        // A cast, not address(): doesn't need validating, and a throw would break render for no gain.
        programAddress: programId as Address,
    });
}

/**
 * Helper to extract compute units from a compute budget instruction
 */
function extractComputeUnitsFromInstruction(instruction: { programAddress: Address; data: Uint8Array }): number | null {
    if (instruction.programAddress !== COMPUTE_BUDGET_PROGRAM_ADDRESS) {
        return null;
    }

    try {
        const ix = {
            accounts: [],
            data: instruction.data,
            programAddress: instruction.programAddress,
        };

        const type = identifyComputeBudgetInstruction(ix);

        if (type === ComputeBudgetInstruction.SetComputeUnitLimit) {
            const parsed = parseSetComputeUnitLimitInstruction(ix);
            return parsed.data.units;
        } else if (type === ComputeBudgetInstruction.RequestUnits) {
            const parsed = parseRequestUnitsInstruction(ix);
            return parsed.data.units;
        }
    } catch {
        // Instruction is not a recognized compute budget instruction
    }

    return null;
}

/**
 * Estimate the requested compute units for a transaction
 * @param tx - The transaction to analyze
 * @param epoch - The epoch of the transaction
 * @param cluster - The cluster the transaction is on
 * @returns The estimated compute units requested
 */
export function estimateRequestedComputeUnits(
    tx: BlockTransaction,
    epoch: bigint | undefined,
    cluster: Cluster,
): number {
    // v1 carries its compute unit limit in the message config; an absent limit means zero.
    if (tx.message.version === 1) {
        return Math.min(getBlockTransactionConfig(tx.message)?.computeUnitLimit ?? 0, MAX_COMPUTE_UNITS);
    }

    // First, check for explicit compute budget instructions
    let totalReservedUnits = 0;
    for (const instruction of getBlockTransactionInstructions(tx.message)) {
        const programAddress = tx.message.staticAccounts[instruction.programAddressIndex];
        const requestedUnits = extractComputeUnitsFromInstruction({
            data: instruction.data,
            programAddress,
        });

        if (requestedUnits !== null) {
            totalReservedUnits = requestedUnits;
            break;
        } else {
            const reservedUnits = getReservedComputeUnits({
                cluster,
                epoch,
                programId: programAddress,
            });
            totalReservedUnits += reservedUnits;
        }
    }

    return Math.min(totalReservedUnits, MAX_COMPUTE_UNITS);
}

/**
 * Estimates requested compute units for a parsed transaction.
 * Checks for compute budget instructions and extracts the units if available.
 */
export function estimateRequestedComputeUnitsForParsedTransaction(
    parsedTransaction: {
        message: {
            instructions: Array<ParsedInstruction | PartiallyDecodedInstruction>;
        };
    },
    epoch: bigint | undefined,
    cluster: Cluster,
): number {
    let totalReservedUnits = 0;
    for (const instruction of parsedTransaction.message.instructions) {
        // For partially decoded instructions, we need the raw data
        if ('data' in instruction && typeof instruction.data === 'string') {
            const requestedUnits = extractComputeUnitsFromInstruction({
                data: new Uint8Array(BASE58_ENCODER.encode(instruction.data)),
                programAddress: address(instruction.programId.toBase58()),
            });

            if (requestedUnits !== null) {
                totalReservedUnits = requestedUnits;
                break;
            }
        }
        const reservedUnits = getReservedComputeUnits({
            cluster,
            epoch,
            programId: instruction.programId.toBase58(),
        });
        totalReservedUnits += reservedUnits;
    }

    return Math.min(totalReservedUnits, MAX_COMPUTE_UNITS);
}

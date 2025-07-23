import { ComputeBudgetProgram, PublicKey } from '@solana/web3.js';

import { Cluster } from '@/app/utils/cluster';

/**
 * Built-in programs that have minimal reserved compute units (3k)
 * This list is based on the feature gate C9oAhLxDBm3ssWtJx1yBGzPY55r2rArHmN1pbQn6HogH
 * Source: https://solana.com/docs/references/feature-gates/reserve-minimal-cus-for-builtins
 */
const BUILTIN_PROGRAMS_3K: readonly string[] = [
    '11111111111111111111111111111111', // System Program
    'Stake11111111111111111111111111111111111111', // Stake Program
    'Vote111111111111111111111111111111111111111', // Vote Program
    'Config1111111111111111111111111111111111111', // Config Program
    'AddressLookupTab1e1111111111111111111111111', // Address Lookup Table Program
    'BPFLoaderUpgradeab1e11111111111111111111111', // BPF Loader Upgradeable
    'BPFLoader1111111111111111111111111111111111', // BPF Loader
    'BPFLoader2111111111111111111111111111111111', // BPF Loader 2
    'LoaderV411111111111111111111111111111111111', // Loader v4
    'ComputeBudget111111111111111111111111111111', // Compute Budget Program
    'KeccakSecp256k11111111111111111111111111111', // Keccak Secp256k1
    'Ed25519SigVerify111111111111111111111111111', // Ed25519 Signature Verify
];


/**
 * Represents a configuration for reserved compute units based on epoch
 */
interface ComputeUnitReserveConfig {
    /** Description of the change */
    readonly description: string;
    /** Feature account that activated this change (if applicable) */
    readonly featureAccount?: string;
    /** When the configuration becomes active on each cluster */
    readonly activations: {
        readonly [Cluster.MainnetBeta]: number;
        readonly [Cluster.Devnet]: number;
        readonly [Cluster.Testnet]: number;
    };
    /** Function to get reserved compute units for a given program */
    readonly getReservedUnits: (programId: string) => number;
}

/**
 * Default compute units for transactions without explicit compute budget
 */
const DEFAULT_COMPUTE_UNITS = 200_000;

/**
 * Minimal compute units for built-in programs
 */
const MINIMAL_BUILTIN_COMPUTE_UNITS = 3_000;
const MAX_COMPUTE_UNITS = 1_400_000;

/**
 * Compute unit reserve configurations by epoch
 * Add new configurations here as features are activated
 */
const COMPUTE_UNIT_RESERVE_CONFIGS: readonly ComputeUnitReserveConfig[] = [
    {
        activations: {
            [Cluster.MainnetBeta]: 0,
            [Cluster.Devnet]: 0,
            [Cluster.Testnet]: 0,
        },
        description: 'Initial configuration - no built-in program optimization',
        getReservedUnits: (_programId: string) => DEFAULT_COMPUTE_UNITS,
    },
    {
        activations: {
            [Cluster.MainnetBeta]: 759,
            [Cluster.Devnet]: 842,
            [Cluster.Testnet]: 750,
        },
        description: 'Built-in programs use minimal compute units',
        featureAccount: 'C9oAhLxDBm3ssWtJx1yBGzPY55r2rArHmN1pbQn6HogH',
        getReservedUnits: (programId: string) => {
            if (BUILTIN_PROGRAMS_3K.includes(programId)) {
                return MINIMAL_BUILTIN_COMPUTE_UNITS;
            }
            // Feature gate program is already BPF at this point, uses default
            return DEFAULT_COMPUTE_UNITS;
        },
    },
];

/**
 * Get the reserved compute units for a program at a given epoch
 * @param programId - The program ID to check
 * @param epoch - The epoch to check
 * @param cluster - The cluster to check
 * @returns The reserved compute units for the program
 */
export function getReservedComputeUnits({
    programId,
    epoch = 0n,
    cluster,
}: {
    programId: string;
    epoch?: bigint;
    cluster: Cluster;
}): number {
    if (cluster === Cluster.Custom) {
        // For custom clusters, use the most recent configuration
        const latestConfig = COMPUTE_UNIT_RESERVE_CONFIGS[COMPUTE_UNIT_RESERVE_CONFIGS.length - 1];
        return latestConfig.getReservedUnits(programId);
    }

    const epochNumber = Number(epoch);

    let applicableConfig = COMPUTE_UNIT_RESERVE_CONFIGS[0];
    let highestActivationEpoch = -1;

    for (const config of COMPUTE_UNIT_RESERVE_CONFIGS) {
        const activationEpoch = config.activations[cluster];
        if (activationEpoch <= epochNumber && activationEpoch > highestActivationEpoch) {
            applicableConfig = config;
            highestActivationEpoch = activationEpoch;
        }
    }

    return applicableConfig.getReservedUnits(programId);
}

/**
 * Estimate the requested compute units for a transaction
 * @param tx - The transaction to analyze
 * @param epoch - The epoch of the transaction
 * @param cluster - The cluster the transaction is on
 * @returns The estimated compute units requested
 */
export function estimateRequestedComputeUnits(
    tx: {
        transaction: {
            message: {
                compiledInstructions: Array<{
                    programIdIndex: number;
                    data: Uint8Array;
                }>;
                staticAccountKeys: PublicKey[];
            };
        };
    },
    epoch: bigint | undefined,
    cluster: Cluster
): number {
    let requestedUnits: number | null = null;

    // First, check for explicit compute budget instructions
    for (const instruction of tx.transaction.message.compiledInstructions) {
        const programId = tx.transaction.message.staticAccountKeys[instruction.programIdIndex];

        if (programId.toBase58() === ComputeBudgetProgram.programId.toBase58() && instruction.data.length > 0) {
            const data = Buffer.from(instruction.data);
            const instructionType = data[0];

            // Check for SetComputeUnitLimit instruction (type 2)
            if (instructionType === 2 && data.length >= 5) {
                requestedUnits = data.readUInt32LE(1);
                break; // Found compute unit limit, stop searching
            }
            // Check for deprecated RequestUnits instruction (type 0)
            else if (instructionType === 0 && data.length >= 5) {
                requestedUnits = data.readUInt32LE(1);
                break;
            }
        }
    }

    // If we found an explicit compute budget, return it
    if (requestedUnits !== null) {
        return requestedUnits;
    }

    // No compute budget instruction, check if all instructions are from built-in programs
    // that would use minimal compute units
    let totalReservedUnits = 0;
    for (const instruction of tx.transaction.message.compiledInstructions) {
        const programId = tx.transaction.message.staticAccountKeys[instruction.programIdIndex].toBase58();
        const reservedUnits = getReservedComputeUnits({
            cluster,
            epoch,
            programId,
        });
        totalReservedUnits += reservedUnits;
    }

    return Math.min(totalReservedUnits, MAX_COMPUTE_UNITS);
}
import type { Address } from '@solana/kit';

/** Cluster names the schedule is keyed by. `'custom'` is extra: it has no activation history to read. */
export type ScheduleCluster = 'custom' | 'devnet' | 'mainnet-beta' | 'testnet';

export const MAX_COMPUTE_UNITS = 1_400_000;

const DEFAULT_COMPUTE_UNITS = 200_000;
const MINIMAL_BUILTIN_COMPUTE_UNITS = 3_000;

/**
 * Builtins reserve 3k instead of the default once feature gate C9oAhLxDBm3ssWtJx1yBGzPY55r2rArHmN1pbQn6HogH is active.
 * https://solana.com/docs/references/feature-gates/reserve-minimal-cus-for-builtins
 */
const BUILTIN_PROGRAMS_3K: readonly string[] = [
    // System Program
    '11111111111111111111111111111111',
    // Stake Program
    'Stake11111111111111111111111111111111111111',
    // Config Program
    'Config1111111111111111111111111111111111111',
    // Address Lookup Table Program
    'AddressLookupTab1e1111111111111111111111111',
    // BPF Loader Upgradeable
    'BPFLoaderUpgradeab1e11111111111111111111111',
    // BPF Loader
    'BPFLoader1111111111111111111111111111111111',
    // BPF Loader 2
    'BPFLoader2111111111111111111111111111111111',
    // Loader v4
    'LoaderV411111111111111111111111111111111111',
    // Compute Budget Program
    'ComputeBudget111111111111111111111111111111',
    // Keccak Secp256k1
    'KeccakSecp256k11111111111111111111111111111',
    // Ed25519 Signature Verify
    'Ed25519SigVerify111111111111111111111111111',
];

type ComputeUnitReserveConfig = {
    readonly activations: { readonly 'mainnet-beta': number; readonly devnet: number; readonly testnet: number };
    readonly description: string;
    readonly featureAccount?: string;
    readonly getReservedUnits: (programAddress: string) => number;
};

const COMPUTE_UNIT_RESERVE_CONFIGS: readonly ComputeUnitReserveConfig[] = [
    {
        activations: {
            'mainnet-beta': 0,
            devnet: 0,
            testnet: 0,
        },
        description: 'Initial configuration - no built-in program optimization',
        getReservedUnits: (_programAddress: string) => DEFAULT_COMPUTE_UNITS,
    },
    {
        activations: {
            'mainnet-beta': 759,
            devnet: 842,
            testnet: 750,
        },
        description: 'Built-in programs use minimal compute units',
        featureAccount: 'C9oAhLxDBm3ssWtJx1yBGzPY55r2rArHmN1pbQn6HogH',
        getReservedUnits: (programAddress: string) => {
            if (BUILTIN_PROGRAMS_3K.includes(programAddress)) {
                return MINIMAL_BUILTIN_COMPUTE_UNITS;
            }
            // Feature gate program is already BPF at this point, uses the default.
            return DEFAULT_COMPUTE_UNITS;
        },
    },
];

export function getReservedComputeUnits({
    cluster,
    epoch = 0n,
    programAddress,
}: {
    cluster: ScheduleCluster;
    epoch?: bigint;
    programAddress: Address;
}): number {
    if (cluster === 'custom') {
        // No activation history to read, so the newest rules are the best estimate.
        const latestConfig = COMPUTE_UNIT_RESERVE_CONFIGS[COMPUTE_UNIT_RESERVE_CONFIGS.length - 1];
        return latestConfig.getReservedUnits(programAddress);
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

    return applicableConfig.getReservedUnits(programAddress);
}

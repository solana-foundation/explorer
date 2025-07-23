const MINIMUM_SLOT_PER_EPOCH = BigInt(32);

export interface EpochSchedule {
    /** The maximum number of slots in each epoch */
    slotsPerEpoch: bigint;
    /** The first epoch with `slotsPerEpoch` slots */
    firstNormalEpoch: bigint;
    /** The first slot of `firstNormalEpoch` */
    firstNormalSlot: bigint;
}

// Returns the number of trailing zeros in the binary representation of n
function trailingZeros(n: bigint): number {
    let trailingZeros = 0;
    while (n > 1) {
        n /= 2n;
        trailingZeros++;
    }
    return trailingZeros;
}

// Returns the smallest power of two greater than or equal to n
function nextPowerOfTwo(n: bigint): bigint {
    if (n === 0n) return 1n;
    n--;
    n |= n >> 1n;
    n |= n >> 2n;
    n |= n >> 4n;
    n |= n >> 8n;
    n |= n >> 16n;
    n |= n >> 32n;
    return n + 1n;
}

/**
 * Get the epoch number for a given slot
 * @param epochSchedule Epoch schedule information
 * @param slot The slot to get the epoch number for
 * @returns The epoch number that contains or will contain the given slot
 */
export function getEpochForSlot(epochSchedule: EpochSchedule, slot: bigint): bigint {
    if (slot < epochSchedule.firstNormalSlot) {
        const epoch =
            trailingZeros(nextPowerOfTwo(slot + MINIMUM_SLOT_PER_EPOCH + BigInt(1))) -
            trailingZeros(MINIMUM_SLOT_PER_EPOCH) -
            1;

        return BigInt(epoch);
    } else {
        const normalSlotIndex = slot - epochSchedule.firstNormalSlot;
        const normalEpochIndex = normalSlotIndex / epochSchedule.slotsPerEpoch;
        const epoch = epochSchedule.firstNormalEpoch + normalEpochIndex;
        return epoch;
    }
}

/**
 * Get the first slot in a given epoch
 * @param epochSchedule Epoch schedule information
 * @param epoch Epoch to get the first slot for
 * @returns First slot in the epoch
 */
export function getFirstSlotInEpoch(epochSchedule: EpochSchedule, epoch: bigint): bigint {
    if (epoch <= epochSchedule.firstNormalEpoch) {
        return (2n ** epoch - 1n) * MINIMUM_SLOT_PER_EPOCH;
    } else {
        return (epoch - epochSchedule.firstNormalEpoch) * epochSchedule.slotsPerEpoch + epochSchedule.firstNormalSlot;
    }
}

/**
 * Get the last slot in a given epoch
 * @param epochSchedule Epoch schedule information
 * @param epoch Epoch to get the last slot for
 * @returns Last slot in the epoch
 */
export function getLastSlotInEpoch(epochSchedule: EpochSchedule, epoch: bigint): bigint {
    return getFirstSlotInEpoch(epochSchedule, epoch + 1n) - 1n;
}


/**
 * Configuration for maximum compute units per epoch.
 * Solana's compute unit limits have changed over time as the network has evolved.
 */
interface ComputeUnitEpochConfig {
    /** The starting epoch when this configuration becomes active */
    readonly startEpoch: number;
    /** Maximum compute units allowed per transaction in this epoch range */
    readonly maxComputeUnits: number;
    /** Optional reference URL for the governance proposal or announcement */
    readonly referenceUrl?: string;
}

/**
 * Historical compute unit configurations for Solana epochs.
 * Configurations are ordered chronologically by startEpoch.
 */
const COMPUTE_UNIT_EPOCH_CONFIGS: readonly ComputeUnitEpochConfig[] = [
    {
        startEpoch: 0,
        maxComputeUnits: 48_000_000,
    },
    {
        startEpoch: 770,
        maxComputeUnits: 50_000_000,
        referenceUrl: 'https://explorer.solana.com/address/5oMCU3JPaFLr8Zr4ct7yFA7jdk6Mw1RmB8K4u9ZbS42z',
    },
    {
        startEpoch: 822,
        maxComputeUnits: 60_000_000,
        referenceUrl: 'https://explorer.solana.com/address/6oMCUgfY6BzZ6jwB681J6ju5Bh6CjVXbd7NeWYqiXBSu',
    },
] as const;

/**
 * Retrieves the maximum compute units allowed for a given epoch.
 * @param epoch - The epoch number to query. Must be non-negative.
 * @returns The maximum compute units allowed in a block for the specified epoch
 * (defaults to the first epoch's config if epoch is undefined or negative, though this should never happen)
 */
export function getMaxComputeUnitsInBlock(epoch?: number): number {
    if (epoch === undefined || epoch < 0) {
        return COMPUTE_UNIT_EPOCH_CONFIGS[0].maxComputeUnits;
    }

    const applicableConfig = COMPUTE_UNIT_EPOCH_CONFIGS.reduce(
        (latest, config) => {
            if (config.startEpoch <= epoch) {
                // Return the config with the higher startEpoch (more recent)
                return config.startEpoch >= latest.startEpoch ? config : latest;
            }
            return latest;
        },
        COMPUTE_UNIT_EPOCH_CONFIGS[0] // Start with the first config as fallback
    );


    if (!applicableConfig) {
        throw new Error(`No configuration found for epoch ${epoch}`);
    }

    return applicableConfig.maxComputeUnits;
}
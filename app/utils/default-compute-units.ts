// https://github.com/anza-xyz/agave/blob/v2.1.13/programs/system/src/system_processor.rs#L299
const SYSTEM_PROGRAM_INSTRUCTION_COMPUTE_UNITS = 150;

// https://github.com/anza-xyz/agave/blob/v2.1.13/programs/address-lookup-table/src/processor.rs#L23
const ADDRESS_LOOKUP_TABLE_INSTRUCTION_COMPUTE_UNITS = 750;

// https://github.com/anza-xyz/agave/blob/v2.1.13/programs/bpf_loader/src/lib.rs#L54
const BPF_LOADER_COMPUTE_UNITS = 570;

// https://github.com/anza-xyz/agave/blob/v2.1.13/programs/bpf_loader/src/lib.rs#L55
const BPF_LOADER_DEPRECATED_COMPUTE_UNITS = 1140;

// https://github.com/anza-xyz/agave/blob/v2.1.13/programs/bpf_loader/src/lib.rs#L56
const UPGRADEABLE_LOADER_COMPUTE_UNITS = 2370;

// https://github.com/anza-xyz/agave/blob/v2.1.13/programs/stake/src/stake_instruction.rs#L50
const STAKE_PROGRAM_COMPUTE_UNITS = 750;

// https://github.com/anza-xyz/agave/blob/v2.1.13/programs/vote/src/vote_processor.rs#L54
const VOTE_PROGRAM_COMPUTE_UNITS = 2100;

// https://github.com/anza-xyz/agave/blob/v2.1.13/programs/loader-v4/src/lib.rs#L26
const LOADER_V4_COMPUTE_UNITS = 2000;

// https://github.com/anza-xyz/agave/blob/v2.1.13/programs/compute-budget/src/lib.rs#L3
const COMPUTE_BUDGET_PROGRAM_COMPUTE_UNITS = 150;

export const PROGRAM_DEFAULT_COMPUTE_UNITS: Record<string, number> = {
    '11111111111111111111111111111111': SYSTEM_PROGRAM_INSTRUCTION_COMPUTE_UNITS,
    AddressLookupTab1e1111111111111111111111111: ADDRESS_LOOKUP_TABLE_INSTRUCTION_COMPUTE_UNITS,
    BPFLoader1111111111111111111111111111111111: BPF_LOADER_COMPUTE_UNITS,
    BPFLoader2111111111111111111111111111111111: BPF_LOADER_DEPRECATED_COMPUTE_UNITS,
    BPFLoaderUpgradeab1e11111111111111111111111: UPGRADEABLE_LOADER_COMPUTE_UNITS,
    ComputeBudget111111111111111111111111111111: COMPUTE_BUDGET_PROGRAM_COMPUTE_UNITS,
    LoaderV411111111111111111111111111111111111: LOADER_V4_COMPUTE_UNITS,
    Stake11111111111111111111111111111111111111: STAKE_PROGRAM_COMPUTE_UNITS,
    Vote111111111111111111111111111111111111111: VOTE_PROGRAM_COMPUTE_UNITS,
};

export function getDefaultComputeUnits(programId: string): number {
    return PROGRAM_DEFAULT_COMPUTE_UNITS[programId] ?? 0;
}

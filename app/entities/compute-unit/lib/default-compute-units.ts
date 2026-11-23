import { getOwn } from '@shared/lib/object';
import { ZK_ELGAMAL_PROOF_PROGRAM_ID } from '@utils/programs';

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

/** Returns the fixed cost of an instruction, or `undefined` for a program whose cost is not fixed. */
export function getDefaultComputeUnits(programId: string, data?: Uint8Array): number | undefined {
    if (programId === ZK_ELGAMAL_PROOF_PROGRAM_ID) return data && ZK_ELGAMAL_PROOF_COMPUTE_UNITS[data[0]];

    return PROGRAM_DEFAULT_COMPUTE_UNITS[programId];
}

// The runtime verifies a precompile outside the VM, so a precompile writes no logs and costs no compute units.
export function isPrecompile(programId: string): boolean {
    return PRECOMPILE_ADDRESSES.includes(programId);
}

const PRECOMPILE_ADDRESSES: readonly string[] = [
    'Ed25519SigVerify111111111111111111111111111',
    'KeccakSecp256k11111111111111111111111111111',
    'Secp256r1SigVerify1111111111111111111111111',
];

// The cost of each instruction, indexed by the first byte of the instruction data.
// https://github.com/anza-xyz/agave/blob/v2.1.13/programs/zk-elgamal-proof/src/lib.rs#L20
const ZK_ELGAMAL_PROOF_COMPUTE_UNITS: readonly (number | undefined)[] = [
    3_300, // CloseContextState
    6_000, // VerifyZeroCiphertext
    8_000, // VerifyCiphertextCiphertextEquality
    6_400, // VerifyCiphertextCommitmentEquality
    2_600, // VerifyPubkeyValidity
    6_500, // VerifyPercentageWithCap
    111_000, // VerifyBatchedRangeProofU64
    200_000, // VerifyBatchedRangeProofU128
    368_000, // VerifyBatchedRangeProofU256
    6_400, // VerifyGroupedCiphertext2HandlesValidity
    13_000, // VerifyBatchedGroupedCiphertext2HandlesValidity
    8_100, // VerifyGroupedCiphertext3HandlesValidity
    16_400, // VerifyBatchedGroupedCiphertext3HandlesValidity
];

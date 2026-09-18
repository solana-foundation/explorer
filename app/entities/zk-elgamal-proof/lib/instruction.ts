import { ZK_ELGAMAL_PROOF_PROGRAM_ID } from '@utils/programs';

// Human-readable names for ZK ElGamal Proof Program instructions, indexed by the
// 1-byte discriminator (0..=12) at the start of the instruction data.
const INSTRUCTION_NAMES: readonly string[] = [
    'Close Context State',
    'Verify Zero Ciphertext',
    'Verify Ciphertext-Ciphertext Equality',
    'Verify Ciphertext-Commitment Equality',
    'Verify Pubkey Validity',
    'Verify Percentage With Cap',
    'Verify Batched Range Proof (U64)',
    'Verify Batched Range Proof (U128)',
    'Verify Batched Range Proof (U256)',
    'Verify Grouped Ciphertext (2 handles)',
    'Verify Batched Grouped Ciphertext (2 handles)',
    'Verify Grouped Ciphertext (3 handles)',
    'Verify Batched Grouped Ciphertext (3 handles)',
];

export function isZkElGamalProofProgram(programId: string): boolean {
    return programId === ZK_ELGAMAL_PROOF_PROGRAM_ID;
}

export function getZkElGamalProofInstructionName(discriminator: number): string {
    return INSTRUCTION_NAMES[discriminator] ?? 'Unknown Instruction';
}

/**
 * Resolve an instruction's name from its program id + raw data, or `undefined` if it isn't a ZK ElGamal
 * Proof instruction — so a caller can compose it with other name resolvers (`zkName(...) ?? idlName(...)`)
 * without knowing the program id or that the name lives in the leading discriminator byte.
 *
 * Returns undefined for an unrecognized discriminator too, rather than the "Unknown Instruction" label
 * `getZkElGamalProofInstructionName` renders: a resolver in a chain must report "I cannot name this" so
 * later sources still get a turn and the caller keeps its own fallback.
 */
export function resolveZkElGamalProofName(programId: string, data: Uint8Array): string | undefined {
    if (!isZkElGamalProofProgram(programId)) return undefined;

    // Widened to make the out-of-range read honest: `INSTRUCTION_NAMES` is a `string[]`, so indexing it
    // types as `string` while an unrecognized discriminator — or empty data — yields undefined.
    const names: Record<number, string | undefined> = INSTRUCTION_NAMES;
    return names[data[0] ?? -1];
}

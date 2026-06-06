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

export function getZkElGamalProofInstructionName(discriminator: number): string {
    return INSTRUCTION_NAMES[discriminator] ?? 'Unknown Instruction';
}

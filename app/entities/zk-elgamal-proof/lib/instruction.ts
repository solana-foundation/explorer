import { type TransactionInstruction } from '@solana/web3.js';
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

// Close Context State is discriminator 0; its account layout differs from the verify variants.
const CLOSE_CONTEXT_STATE_DISCRIMINATOR = 0;

export type ZkElGamalProofInstruction = {
    name: string;
    discriminator: number;
    isCloseContextState: boolean;
    proofByteLength: number;
};

export function isZkElGamalProofProgram(programId: string): boolean {
    return programId === ZK_ELGAMAL_PROOF_PROGRAM_ID;
}

export function isZkElGamalProofInstruction(ix: TransactionInstruction): boolean {
    return isZkElGamalProofProgram(ix.programId.toBase58());
}

export function getZkElGamalProofInstructionName(discriminator: number): string {
    return INSTRUCTION_NAMES[discriminator] ?? 'Unknown Instruction';
}

/**
 * Resolve an instruction's name from its program id + raw data, or `undefined` if it isn't a ZK ElGamal
 * Proof instruction — so a caller can compose it with other name resolvers (`zkName(...) ?? idlName(...)`)
 * without knowing the program id or that the name lives in the leading discriminator byte.
 */
export function resolveZkElGamalProofName(programId: string, data: Uint8Array): string | undefined {
    if (!isZkElGamalProofProgram(programId)) return undefined;
    return getZkElGamalProofInstructionName(data[0] ?? -1);
}

// Instruction data layout: [discriminator (1 byte), ...raw_proof_bytes]. For verify variants using a
// record/context-state account, raw_proof_bytes is empty and the proof lives off-instruction.
export function parseZkElGamalProofInstruction(data: Uint8Array): ZkElGamalProofInstruction {
    const discriminator = data.length > 0 ? data[0] : -1;
    return {
        discriminator,
        isCloseContextState: discriminator === CLOSE_CONTEXT_STATE_DISCRIMINATOR,
        name: getZkElGamalProofInstructionName(discriminator),
        proofByteLength: data.length > 1 ? data.length - 1 : 0,
    };
}

// Account layouts:
//   CloseContextState: [context_state, destination, authority]
//   Verify with proof in instruction data: []
//   Verify with record account: [record_account]
//   Verify with context state account: [context_state, context_state_authority]
export function getZkElGamalProofAccountLabel(
    index: number,
    { isCloseContextState, accountCount }: { isCloseContextState: boolean; accountCount: number },
): string {
    if (isCloseContextState) {
        if (index === 0) return 'Context State Account';
        if (index === 1) return 'Destination';
        if (index === 2) return 'Authority';
        return `Account #${index + 1}`;
    }
    if (accountCount === 1 && index === 0) return 'Record Account';
    if (accountCount === 2) {
        if (index === 0) return 'Context State Account';
        if (index === 1) return 'Context State Authority';
    }
    return `Account #${index + 1}`;
}

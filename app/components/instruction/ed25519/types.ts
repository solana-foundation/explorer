import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { PublicKeyFromString } from '@validators/pubkey';
import { Infer, type } from 'superstruct';

const PROGRAM_ADDRESS = 'Ed25519SigVerify111111111111111111111111111';
export const PROGRAM_ID = new PublicKey(PROGRAM_ADDRESS);

export type Ed25519Info = Infer<typeof Ed25519Info>;
export const Ed25519Info = type({
    account: PublicKeyFromString,
});

export function isEd25519Instruction(instruction: TransactionInstruction): boolean {
    return PROGRAM_ADDRESS === instruction.programId.toBase58();
}

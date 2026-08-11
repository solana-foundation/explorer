import { PMP_ADDRESS } from '@entities/pmp-account/@x/decode-instruction-pmp';
import type { TransactionInstruction } from '@solana/web3.js';

/**
 * Whether an instruction targets the Program Metadata Program. Mirrors the per-program guards it sits alongside
 * (`isLighthouseInstruction`, `isPythInstruction`, ...) and is used by both the tx page and the inspector.
 *
 * Imports the address from the entity's library-free `@x` surface rather than from `constants`, which pulls the
 * generated client: this runs on every instruction of every transaction, so it is the one PMP module that must
 * stay in first-load JS.
 */
export function isProgramMetadataInstruction(ix: TransactionInstruction): boolean {
    return ix.programId.toBase58() === PMP_ADDRESS;
}

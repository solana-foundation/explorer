import type { KitInstruction, ParsedInstructionInfo, ParserProgramLabel } from '@explorer/parsers';

import { decodeEd25519Offsets, type Ed25519SignatureOffsets } from './ed25519-decode';

export const ED25519_PROGRAM_ADDRESS = 'Ed25519SigVerify111111111111111111111111111';

/** The RPC never pre-parses the precompile, so this is a synthetic label carried through the dispatcher. */
export const ED25519_PROGRAM_LABEL = 'ed25519' satisfies ParserProgramLabel;

export type Ed25519VerifyInfo = {
    /**
     * Only the offsets table, not the bytes it names: an offset may point into another
     * instruction, and the parser sees one instruction at a time. The card follows the
     * offsets with `resolveEd25519Signatures` once it has the whole transaction.
     */
    signatures: Ed25519SignatureOffsets[];
};

export type Ed25519Parsed = ParsedInstructionInfo<'Verify', Ed25519VerifyInfo>;

/** The count byte and its padding are the smallest well-formed instruction. */
const HEADER_SIZE = 2;

export function parseEd25519Instruction(ix: KitInstruction): Ed25519Parsed | undefined {
    if (ix.data.length < HEADER_SIZE) {
        return undefined;
    }
    return { info: { signatures: decodeEd25519Offsets(ix.data) }, type: 'Verify' };
}

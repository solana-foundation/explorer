import { getZkElGamalProofInstructionName } from '@entities/zk-elgamal-proof';
import type { KitInstruction, ParsedInstructionInfo, ParserProgramLabel } from '@explorer/parsers';
import type { Address } from '@solana/kit';
import {
    getVerifyProofInstructionDataDecoder,
    parseCloseContextStateInstruction,
    ZK_ELGAMAL_PROOF_PROGRAM_ADDRESS,
    ZkElGamalProofInstruction,
} from '@solana-program/zk-elgamal-proof';

export { ZK_ELGAMAL_PROOF_PROGRAM_ADDRESS };

/** The RPC never pre-parses this program, so this is a synthetic label carried through the dispatcher. */
export const ZK_ELGAMAL_PROOF_PROGRAM_LABEL = 'zk-elgamal-proof' satisfies ParserProgramLabel;

export type CloseContextStateInfo = {
    contextState: Address;
    destination: Address;
    authority: Address;
};

/**
 * Where the proof bytes live: inline in the instruction, or in a record account at `offset`
 * (a 5-byte instruction). Either variant may also name a context state to write the verified
 * context into.
 */
export type VerifyProofInfo = {
    name: string;
    proofByteLength?: number;
    recordAccount?: Address;
    offset?: number;
    contextState?: Address;
    contextStateAuthority?: Address;
};

export type ZkElGamalProofParsed =
    | ParsedInstructionInfo<'CloseContextState', CloseContextStateInfo>
    | ParsedInstructionInfo<'VerifyProof', VerifyProofInfo>;

export function parseZkElGamalProofInstruction(ix: KitInstruction): ZkElGamalProofParsed | undefined {
    const discriminator = ix.data[0];
    if (discriminator === undefined || !(discriminator in ZkElGamalProofInstruction)) {
        return undefined;
    }
    if (discriminator === ZkElGamalProofInstruction.CloseContextState) {
        return parseCloseContextState(ix);
    }
    return parseVerifyProof(ix, discriminator);
}

function parseCloseContextState(ix: KitInstruction): ZkElGamalProofParsed | undefined {
    if (ix.accounts.length < 3) {
        return undefined;
    }
    const { accounts } = parseCloseContextStateInstruction(ix);
    return {
        info: {
            authority: accounts.authority.address,
            contextState: accounts.contextState.address,
            destination: accounts.destination.address,
        },
        type: 'CloseContextState',
    };
}

/**
 * Account layouts the program accepts, in order: an optional record account (only when the
 * proof is read at an offset), then an optional `[context_state, context_state_authority]` pair.
 */
function parseVerifyProof(ix: KitInstruction, discriminator: number): ZkElGamalProofParsed {
    const data = getVerifyProofInstructionDataDecoder().decode(ix.data);
    const [recordAccount, ...contextAccounts] = data.offset === undefined ? [undefined, ...ix.accounts] : ix.accounts;
    const [contextState, contextStateAuthority] = contextAccounts;

    return {
        info: {
            contextState: contextState?.address,
            contextStateAuthority: contextStateAuthority?.address,
            name: getZkElGamalProofInstructionName(discriminator),
            offset: data.offset,
            proofByteLength: data.proofData?.length,
            recordAccount: recordAccount?.address,
        },
        type: 'VerifyProof',
    };
}

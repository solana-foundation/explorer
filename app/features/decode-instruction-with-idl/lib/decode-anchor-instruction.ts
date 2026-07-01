import { BorshEventCoder, BorshInstructionCoder, Idl, Instruction, Program } from '@coral-xyz/anchor';
import { IdlEvent, IdlField, IdlInstruction, IdlTypeDefTyStruct } from '@coral-xyz/anchor/dist/cjs/idl';
import { TransactionInstruction } from '@solana/web3.js';
import {
    decodeEventWithCustomDiscriminator,
    decodeInstructionWithCustomDiscriminator,
    FlattenedIdlAccount,
    getAnchorAccountsFromInstruction,
    getAnchorNameForInstruction,
    getAnchorProgramName,
    instructionIsSelfCPI,
} from '@utils/anchor';
import { camelToTitleCase } from '@utils/index';

import { toBase64 } from '@/app/shared/lib/bytes';

export type AnchorInstructionDecoded = {
    programName: string;
    ixName: string;
    cardTitle: string;
    // The fields below are undefined when the bytes can't be decoded against the public Anchor
    // interface — the card renders a "failed to decode" row in that case.
    decodedIxData: Instruction | undefined;
    ixAccounts: FlattenedIdlAccount[] | undefined;
    ixDef: IdlInstruction | undefined;
};

// Decode a single Anchor instruction against its program's IDL — the rich-path counterpart to the codama
// decode in `decode-instruction-with-idl` (reached as the fallback when codama can't convert the IDL).
// Pure: lifted out of the former AnchorDetailsCard so the card stays presentational. Handles self-CPI
// event instructions, custom (variable-length) discriminators, and nested account groups.
export function decodeAnchorInstruction(
    anchorProgram: Program<Idl>,
    ix: TransactionInstruction,
): AnchorInstructionDecoded {
    const programName = getAnchorProgramName(anchorProgram) ?? 'Unknown Program';
    const ixName = getAnchorNameForInstruction(ix, anchorProgram) ?? 'Unknown Instruction';
    const cardTitle = `${camelToTitleCase(programName)}: ${camelToTitleCase(ixName)}`;

    let ixAccounts: FlattenedIdlAccount[] | undefined;
    let decodedIxData: Instruction | undefined;
    let ixDef: IdlInstruction | undefined;

    const encodedInstructionData = toBase64(ix.data.slice(8));
    if (instructionIsSelfCPI(ix.data)) {
        // Try custom discriminator decoder first (handles variable-length discriminators)
        decodedIxData = decodeEventWithCustomDiscriminator(encodedInstructionData, anchorProgram) ?? undefined;

        // Fallback to standard Anchor event decoder
        if (!decodedIxData) {
            const coder = new BorshEventCoder(anchorProgram.idl);
            decodedIxData = coder.decode(encodedInstructionData) ?? undefined;
        }
        const ixEventDef = anchorProgram.idl.events?.find(event => event.name === decodedIxData?.name) as
            | IdlEvent
            | undefined;

        // The decoded event may not resolve to a known IDL event (unknown/mismatched discriminator). Leave
        // the decode fields undefined so the card shows the "failed to decode" row rather than dereferencing
        // an undefined event definition.
        if (ixEventDef) {
            const ixEventFields = anchorProgram.idl.types?.find(type => type.name === ixEventDef.name);
            // `events` and `types` can be out of sync; if the event's type is missing (or isn't a struct),
            // optional-chain to empty args rather than dereferencing `.fields` on undefined (the trailing
            // `?? []` only guards a null `.fields`, not a missing type entry).
            const eventStruct = ixEventFields?.type as IdlTypeDefTyStruct | undefined;

            // Remap the event definition to an instruction definition by force casting to struct fields
            ixDef = {
                ...ixEventDef,
                accounts: [],
                args: (eventStruct?.fields as IdlField[] | undefined) ?? [],
            };

            // Self-CPI instructions have 1 account called the eventAuthority
            // https://github.com/coral-xyz/anchor/blob/04985802587c693091f836e0083e4412148c0ca6/lang/attribute/event/src/lib.rs#L165
            ixAccounts = [{ isMut: false, isSigner: true, name: 'eventAuthority' }];
        }
    } else {
        // Try custom discriminator decoder first (handles variable-length discriminators)
        decodedIxData = decodeInstructionWithCustomDiscriminator(ix.data, anchorProgram) ?? undefined;

        // Fallback to standard Anchor decoder
        if (!decodedIxData) {
            const coder = new BorshInstructionCoder(anchorProgram.idl);
            decodedIxData = coder.decode(ix.data) ?? undefined;
        }

        if (decodedIxData) {
            ixDef = anchorProgram.idl.instructions.find(def => def.name === decodedIxData?.name);
            if (ixDef) {
                ixAccounts = getAnchorAccountsFromInstruction(decodedIxData, anchorProgram) ?? undefined;
            }
        }
    }

    return { cardTitle, decodedIxData, ixAccounts, ixDef, ixName, programName };
}

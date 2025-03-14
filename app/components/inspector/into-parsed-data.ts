import * as spl from '@solana/spl-token';
import {
    AccountMeta,
    ParsedInstruction,
    ParsedMessage,
    ParsedMessageAccount,
    ParsedTransaction,
    PublicKey,
    TransactionInstruction,
    VersionedMessage,
} from '@solana/web3.js';
import { AssociatedTokenInstruction, CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR, identifyAssociatedTokenInstruction, parseCreateAssociatedTokenIdempotentInstruction, parseCreateAssociatedTokenInstruction, parseRecoverNestedAssociatedTokenInstruction } from '@solana-program/token';
import { AccountRole, address, IAccountMeta, IInstruction, IInstructionWithAccounts, IInstructionWithData } from 'web3js-experimental';

function discriminatorToBuffer(discrimnator: number): Buffer{
    return Buffer.from(Uint8Array.from([discrimnator]));
}

function intoProgramName(programId: PublicKey): string | undefined {
    if (programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)) {
        return 'spl-associated-token-account';
    }
    /* add other variants here */
}

function isDataEqual(data1: Buffer, data2: Buffer): boolean {
    // Browser will fail if data2 is created with Uint8Array.from
    return data1.equals(data2);
}

function intoParsedData(instruction: TransactionInstruction, parsed?: any): any{
    const { programId, data } = instruction;
    const UNKNOWN_PROGRAM_TYPE = ''; // empty string represents that the program is unknown
    let info = {};

    if (programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)) {
        let type;
        let instructionData = data;

        // workaround for "create" instructions
        if (isDataEqual(data, Buffer.alloc(CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR))) {
            instructionData = discriminatorToBuffer(CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR);
            instruction.data = instructionData; // overwrite original data with the modified one
        }

        const instructionType = identifyAssociatedTokenInstruction(instructionData);

        switch (instructionType) {
            case AssociatedTokenInstruction.CreateAssociatedToken: {
                type = 'create';
                const idata = intoInstructionData(instruction);
                info = parseCreateAssociatedTokenInstruction(idata);
                break;
            }
            case AssociatedTokenInstruction.CreateAssociatedTokenIdempotent: {
                type = 'createIdempotent';
                const idata = intoInstructionData(instruction);
                info = parseCreateAssociatedTokenIdempotentInstruction(idata);
                break;
            }
            case AssociatedTokenInstruction.RecoverNestedAssociatedToken: {
                type ='recoverNested';
                const idata = intoInstructionData(instruction);
                info = parseRecoverNestedAssociatedTokenInstruction(idata);
                break;
            }
            default: {
                type = UNKNOWN_PROGRAM_TYPE;
            }
        }

        return {
            info: parsed ?? info, // allow for "parsed" to take priority over "info"
            type
        };
    }

    /* add other variants here */

    return {
        info: parsed ?? info,
        type: UNKNOWN_PROGRAM_TYPE,
    };
}

function getInstructionData(instruction: TransactionInstruction, data?: any){
    const program = intoProgramName(instruction.programId);
    const parsed = intoParsedData(instruction, data);

    return { parsed, program };
}


function convertAccountKeysToParsedMessageAccounts(keys: AccountMeta[]): ParsedMessageAccount[]{
    const accountKeys = keys.map((key): ParsedMessageAccount => {
        return {
            pubkey: key.pubkey,
            signer: key.isSigner,
            source: 'lookupTable',
            writable: key.isWritable
        };
    });

    return accountKeys;
}

/**
 * functions that perform conversion from TransactionInstruction (created from VersionedMessage) into ParsedInstruction.
 *
 *  That is needed to keep similarity with existing InstructionCards that expect ParsedInstruction for rendering.
 *
 * @param data - parsed data that should be returned as parsed
 */

export function intoParsedInstruction(transactionInstruction: TransactionInstruction, data?: any): ParsedInstruction {
    const { programId } = transactionInstruction;
    const { program, parsed } = getInstructionData(transactionInstruction, data);

    return {
        parsed,
        program: program ?? '',
        programId
    };
}

export function intoParsedTransaction(transactionInstruction: TransactionInstruction, versionedMessage: VersionedMessage): ParsedTransaction {
    const { keys } = transactionInstruction;
    const { addressTableLookups, recentBlockhash } = versionedMessage;

    const parsedMessage: ParsedMessage = {
        accountKeys: convertAccountKeysToParsedMessageAccounts(keys),
        addressTableLookups,
        // at this moment we do not parse instructions as they are not required to represent the transaction. that's why array is empty
        instructions: [],
        recentBlockhash
    };

    return {
        message: parsedMessage,
        signatures: [],
    };
}

export function upcastAccountMeta({ pubkey, isSigner, isWritable }: AccountMeta): IAccountMeta {
    return {
        address: address(pubkey.toBase58()),
        role: isSigner
            ? (isWritable
              ? AccountRole.WRITABLE_SIGNER
              : AccountRole.READONLY_SIGNER
              )
            : (isWritable
              ? AccountRole.WRITABLE
              : AccountRole.READONLY
            )
    };
}

export function upcastTransactionInstruction(ix: TransactionInstruction) {
    return {
        accounts: ix.keys.map(upcastAccountMeta),
        data: ix.data,
        programAddress: address(ix.programId.toBase58())
    };
}

/**
 * Wrap instruction into format compatible with @solana-program/token library' parsers.
 */
type TAccount = NonNullable<IAccountMeta>
type TInstruction = IInstruction<string> & IInstructionWithAccounts<readonly TAccount[]> & IInstructionWithData<Uint8Array>;
export function intoInstructionData(instruction: TransactionInstruction): TInstruction {
    return upcastTransactionInstruction(instruction);
}

export const privateIntoParsedData = intoParsedData;

import { IAccountMeta, IInstruction, TAccount } from '@solana/kit';
import * as spl from '@solana/spl-token';
import {
    AccountMeta,
    MessageCompiledInstruction,
    ParsedInstruction,
    ParsedMessage,
    ParsedMessageAccount,
    ParsedTransaction,
    PublicKey,
    TransactionInstruction,
    VersionedMessage,
} from '@solana/web3.js';
import { CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR, CREATE_ASSOCIATED_TOKEN_IDEMPOTENT_DISCRIMINATOR, parseCreateAssociatedTokenIdempotentInstruction, parseCreateAssociatedTokenInstruction, parseRecoverNestedAssociatedTokenInstruction,RECOVER_NESTED_ASSOCIATED_TOKEN_DISCRIMINATOR } from '@solana-program/token';

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
    console.log({ data2 });
    // Browser will fail if data2 is created with Uint8Array.from
    return data1.equals(data2);
}

function intoParsedData(instruction: TransactionInstruction, parsed?: any): any{
    const { programId, data } = instruction;
    const UNKNOWN_PROGRAM_TYPE = ''; // empty string represents that the program is unknown
    let info = {};

    if (programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)) {
        let type;
        //console.log("PARSED", data, data.equals(discriminatorToBuffer(CREATE_ASSOCIATED_TOKEN_IDEMPOTENT_DISCRIMINATOR)))
        if (isDataEqual(data, Buffer.alloc(CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR))) {
            type = 'create';
            instruction.data = discriminatorToBuffer(CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR);
            info = parseCreateAssociatedTokenInstruction(intoInstructionData(instruction));
        }
        else if (isDataEqual(data, discriminatorToBuffer(CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR))) {
            type = 'create';
            info = parseCreateAssociatedTokenInstruction(intoInstructionData(instruction));
        }
        else if (isDataEqual(data, discriminatorToBuffer(CREATE_ASSOCIATED_TOKEN_IDEMPOTENT_DISCRIMINATOR))) {
            type = 'createIdempotent';
            info = parseCreateAssociatedTokenIdempotentInstruction(intoInstructionData(instruction));
            console.log(444, { info }, instruction, intoInstructionData(instruction) );
        }
        else if (isDataEqual(data, discriminatorToBuffer(RECOVER_NESTED_ASSOCIATED_TOKEN_DISCRIMINATOR))) {
            type ='recoverNested';
            info = parseRecoverNestedAssociatedTokenInstruction(intoInstructionData(instruction));
        }
        else type = UNKNOWN_PROGRAM_TYPE;

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

/**
 * Wrap instruction into format compatible with @solana-program/token library' parsers.
 *
 */
export function intoInstructionData(instruction: TransactionInstruction | MessageCompiledInstruction): IInstruction {
    let instructionData;
    if ('accountKeyIndexes' in instruction) {
        instructionData = {
            accounts: instruction.accountKeyIndexes.map(a => a.toString()),
            data: instruction.data,
            programAddress: instruction.programIdIndex
        };
    } else {
        instructionData = {
            accounts: instruction.keys,
            data: instruction.data,
            programAddress: instruction.programId.toString(),
        };
    }
    console.log("IInstruction",{ instructionData });
    return instructionData as unknown as {
        accounts: IAccountMeta[];
        data: Uint8Array;
        programAddress: TAccount<string>
    };
}

export const privateIntoParsedData = intoParsedData;

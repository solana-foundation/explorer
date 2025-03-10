import { IAccountMeta, TAccount } from '@solana/kit';
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
import { CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR, CREATE_ASSOCIATED_TOKEN_IDEMPOTENT_DISCRIMINATOR, RECOVER_NESTED_ASSOCIATED_TOKEN_DISCRIMINATOR } from '@solana-program/token';

function discriminatorToBuffer(discrimnator: number): Buffer{
    return Buffer.from(Uint8Array.from([discrimnator]));
}

function intoProgramName(programId: PublicKey): string | undefined {
    if (programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)) {
        return 'spl-associated-token-account';
    }
}

function intoParsedData(instruction: TransactionInstruction, parsed: any): any{
    const { programId, data } = instruction;
    const info = parsed ?? {};

    if (programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)) {
        let type;
        if (data.equals(Buffer.alloc(CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR))) type = 'create';
        else if (data.equals(discriminatorToBuffer(CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR))) type = 'create';
        else if (data.equals(discriminatorToBuffer(CREATE_ASSOCIATED_TOKEN_IDEMPOTENT_DISCRIMINATOR))) type = 'createIdempotent';
        else if (data.equals(discriminatorToBuffer(RECOVER_NESTED_ASSOCIATED_TOKEN_DISCRIMINATOR))) type ='recoverNested';
        else type = '';

        return {
            info,
            type
        };
    }

    return {
        info,
        type: '' // empty string represents that the program was unknown
    };
}

function getInstructionData(instruction: TransactionInstruction, data: any){
    const program = intoProgramName(instruction.programId);
    const parsed = intoParsedData(instruction, data);

    return { parsed, program };
}


function convertAccountKeysToParsedMessageAccounts(keys: AccountMeta[]): ParsedMessageAccount[]{
    const accountKeys= keys.map((key): ParsedMessageAccount => {
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
 */

export function intoParsedInstruction(transactionInstruction: TransactionInstruction, data: any = {}): ParsedInstruction {
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

export function intoInstructionData(instruction: TransactionInstruction | MessageCompiledInstruction){
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
    return instructionData as unknown as {
        accounts: IAccountMeta[];
        data: Uint8Array;
        programAddress: TAccount<string>
    };
}

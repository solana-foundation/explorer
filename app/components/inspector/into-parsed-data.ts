import {
    AdvanceNonceInfo,
    AllocateInfo,
    AllocateWithSeedInfo,
    AssignInfo,
    AssignWithSeedInfo,
    AuthorizeNonceInfo,
    CreateAccountInfo,
    CreateAccountWithSeedInfo,
    InitializeNonceInfo,
    TransferInfo,
    TransferWithSeedInfo,
    UpgradeNonceInfo,
    WithdrawNonceInfo,
} from '@components/instruction/system/types';
import {
    AccountMeta,
    AccountRole,
    address,
    Instruction,
    InstructionWithAccounts,
    InstructionWithData,
} from '@solana/kit';
import * as spl from '@solana/spl-token';
import {
    AccountMeta as LegacyAccountMeta,
    ParsedInstruction,
    ParsedMessage,
    ParsedMessageAccount,
    ParsedTransaction,
    PublicKey,
    SystemProgram,
    TransactionInstruction,
    VersionedMessage,
} from '@solana/web3.js';
import {
    identifySystemInstruction,
    parseAdvanceNonceAccountInstruction,
    parseAllocateInstruction,
    parseAllocateWithSeedInstruction,
    parseAssignInstruction,
    parseAssignWithSeedInstruction,
    parseAuthorizeNonceAccountInstruction,
    parseCreateAccountInstruction,
    parseCreateAccountWithSeedInstruction,
    parseInitializeNonceAccountInstruction,
    parseTransferSolInstruction,
    parseTransferSolWithSeedInstruction,
    parseUpgradeNonceAccountInstruction,
    parseWithdrawNonceAccountInstruction,
    SystemInstruction,
} from '@solana-program/system';
import {
    AssociatedTokenInstruction,
    CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR,
    identifyAssociatedTokenInstruction,
    parseCreateAssociatedTokenIdempotentInstruction,
    parseCreateAssociatedTokenInstruction,
    parseRecoverNestedAssociatedTokenInstruction,
} from '@solana-program/token';

/**
 * Helper function to safely convert BigInt or number to regular number
 */
function safeNumber(value: any): number {
    if (typeof value === 'bigint') {
        return Number(value);
    }
    return Number(value);
}

/**
 * Functions to convert parsed data from @solana-program/system parsers into the parsed structure of RPC's parsed transaction
 */
function convertCreateAccountInfo(parsed: any): CreateAccountInfo {
    return {
        lamports: safeNumber(parsed.data.lamports),
        newAccount: new PublicKey(parsed.accounts.newAccount.address),
        owner: new PublicKey(parsed.data.programAddress),
        source: new PublicKey(parsed.accounts.payer.address),
        space: safeNumber(parsed.data.space),
    };
}

function convertCreateAccountWithSeedInfo(parsed: any): CreateAccountWithSeedInfo {
    return {
        base: new PublicKey(parsed.accounts.baseAccount.address),
        lamports: safeNumber(parsed.data.amount), // Note: field is 'amount' not 'lamports'
        newAccount: new PublicKey(parsed.accounts.newAccount.address),
        owner: new PublicKey(parsed.data.programAddress),
        seed: parsed.data.seed,
        source: new PublicKey(parsed.accounts.payer.address),
        space: safeNumber(parsed.data.space),
    };
}

function convertAllocateInfo(parsed: any): AllocateInfo {
    return {
        account: new PublicKey(parsed.accounts.newAccount.address),
        space: safeNumber(parsed.data.space),
    };
}

function convertAllocateWithSeedInfo(parsed: any): AllocateWithSeedInfo {
    return {
        account: new PublicKey(parsed.accounts.account.address),
        base: new PublicKey(parsed.accounts.baseAccount.address),
        owner: new PublicKey(parsed.data.programAddress),
        seed: parsed.data.seed,
        space: safeNumber(parsed.data.space),
    };
}

function convertAssignInfo(parsed: any): AssignInfo {
    return {
        account: new PublicKey(parsed.accounts.account.address),
        owner: new PublicKey(parsed.data.programAddress),
    };
}

function convertAssignWithSeedInfo(parsed: any): AssignWithSeedInfo {
    return {
        account: new PublicKey(parsed.accounts.account.address),
        base: new PublicKey(parsed.accounts.baseAccount.address),
        owner: new PublicKey(parsed.data.programAddress),
        seed: parsed.data.seed,
    };
}

function convertTransferInfo(parsed: any): TransferInfo {
    return {
        destination: new PublicKey(parsed.accounts.destination.address),
        lamports: safeNumber(parsed.data.amount),
        source: new PublicKey(parsed.accounts.source.address),
    };
}

function convertAdvanceNonceInfo(parsed: any): AdvanceNonceInfo {
    return {
        nonceAccount: new PublicKey(parsed.accounts.nonceAccount.address),
        nonceAuthority: new PublicKey(parsed.accounts.nonceAuthority.address),
    };
}

function convertWithdrawNonceInfo(parsed: any): WithdrawNonceInfo {
    return {
        destination: new PublicKey(parsed.accounts.recipientAccount.address),
        lamports: safeNumber(parsed.data.withdrawAmount),
        nonceAccount: new PublicKey(parsed.accounts.nonceAccount.address),
        nonceAuthority: new PublicKey(parsed.accounts.nonceAuthority.address),
    };
}

function convertAuthorizeNonceInfo(parsed: any): AuthorizeNonceInfo {
    return {
        newAuthorized: new PublicKey(parsed.data.newNonceAuthority),
        nonceAccount: new PublicKey(parsed.accounts.nonceAccount.address),
        nonceAuthority: new PublicKey(parsed.accounts.nonceAuthority.address),
    };
}

function convertInitializeNonceInfo(parsed: any): InitializeNonceInfo {
    return {
        nonceAccount: new PublicKey(parsed.accounts.nonceAccount.address),
        nonceAuthority: new PublicKey(parsed.data.nonceAuthority),
    };
}

function convertTransferWithSeedInfo(parsed: any): TransferWithSeedInfo {
    return {
        destination: new PublicKey(parsed.accounts.destination.address),
        lamports: safeNumber(parsed.data.amount),
        source: new PublicKey(parsed.accounts.source.address),
        sourceBase: new PublicKey(parsed.accounts.baseAccount.address),
        sourceOwner: new PublicKey(parsed.accounts.sourceOwner.address),
        sourceSeed: parsed.data.seed,
    };
}

function convertUpgradeNonceInfo(parsed: any): UpgradeNonceInfo {
    return {
        nonceAccount: new PublicKey(parsed.accounts.nonceAccount.address),
    };
}

function discriminatorToBuffer(discrimnator: number): Buffer {
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

function intoParsedData(instruction: TransactionInstruction, parsed?: any): any {
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
                type = 'recoverNested';
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
            type,
        };
    } else if (programId.equals(SystemProgram.programId)) {
        let type;
        const instructionData = data;

        const instructionType = identifySystemInstruction(instructionData);

        switch (instructionType) {
            case SystemInstruction.CreateAccount: {
                type = 'createAccount';
                const idata = intoInstructionData(instruction);
                const parsed = parseCreateAccountInstruction(idata);
                info = convertCreateAccountInfo(parsed);
                break;
            }
            case SystemInstruction.CreateAccountWithSeed: {
                type = 'createAccountWithSeed';
                const idata = intoInstructionData(instruction);
                const parsed = parseCreateAccountWithSeedInstruction(idata);
                info = convertCreateAccountWithSeedInfo(parsed);
                break;
            }
            case SystemInstruction.Allocate: {
                type = 'allocate';
                const idata = intoInstructionData(instruction);
                const parsed = parseAllocateInstruction(idata);
                info = convertAllocateInfo(parsed);
                break;
            }
            case SystemInstruction.AllocateWithSeed: {
                type = 'allocateWithSeed';
                const idata = intoInstructionData(instruction);
                const parsed = parseAllocateWithSeedInstruction(idata);
                info = convertAllocateWithSeedInfo(parsed);
                break;
            }
            case SystemInstruction.Assign: {
                type = 'assign';
                const idata = intoInstructionData(instruction);
                const parsed = parseAssignInstruction(idata);
                info = convertAssignInfo(parsed);
                break;
            }
            case SystemInstruction.AssignWithSeed: {
                type = 'assignWithSeed';
                const idata = intoInstructionData(instruction);
                const parsed = parseAssignWithSeedInstruction(idata);
                info = convertAssignWithSeedInfo(parsed);
                break;
            }
            case SystemInstruction.TransferSol: {
                type = 'transfer';
                const idata = intoInstructionData(instruction);
                const parsed = parseTransferSolInstruction(idata);
                info = convertTransferInfo(parsed);
                break;
            }
            case SystemInstruction.AdvanceNonceAccount: {
                type = 'advanceNonce';
                const idata = intoInstructionData(instruction);
                const parsed = parseAdvanceNonceAccountInstruction(idata);
                info = convertAdvanceNonceInfo(parsed);
                break;
            }
            case SystemInstruction.WithdrawNonceAccount: {
                type = 'withdrawNonce';
                const idata = intoInstructionData(instruction);
                const parsed = parseWithdrawNonceAccountInstruction(idata);
                info = convertWithdrawNonceInfo(parsed);
                break;
            }
            case SystemInstruction.AuthorizeNonceAccount: {
                type = 'authorizeNonce';
                const idata = intoInstructionData(instruction);
                const parsed = parseAuthorizeNonceAccountInstruction(idata);
                info = convertAuthorizeNonceInfo(parsed);
                break;
            }
            case SystemInstruction.InitializeNonceAccount: {
                type = 'initializeNonce';
                const idata = intoInstructionData(instruction);
                const parsed = parseInitializeNonceAccountInstruction(idata);
                info = convertInitializeNonceInfo(parsed);
                break;
            }
            case SystemInstruction.TransferSolWithSeed: {
                type = 'transferWithSeed';
                const idata = intoInstructionData(instruction);
                const parsed = parseTransferSolWithSeedInstruction(idata);
                info = convertTransferWithSeedInfo(parsed);
                break;
            }
            case SystemInstruction.UpgradeNonceAccount: {
                type = 'upgradeNonce';
                const idata = intoInstructionData(instruction);
                const parsed = parseUpgradeNonceAccountInstruction(idata);
                info = convertUpgradeNonceInfo(parsed);
                break;
            }
            default: {
                type = UNKNOWN_PROGRAM_TYPE;
            }
        }

        return {
            info: parsed ?? info, // allow for "parsed" to take priority over "info"
            type,
        };
    }

    /* add other variants here */

    return {
        info: parsed ?? info,
        type: UNKNOWN_PROGRAM_TYPE,
    };
}

function getInstructionData(instruction: TransactionInstruction, data?: any) {
    const program = intoProgramName(instruction.programId);
    const parsed = intoParsedData(instruction, data);

    return { parsed, program };
}

function convertAccountKeysToParsedMessageAccounts(keys: LegacyAccountMeta[]): ParsedMessageAccount[] {
    const accountKeys = keys.map((key): ParsedMessageAccount => {
        return {
            pubkey: key.pubkey,
            signer: key.isSigner,
            source: 'lookupTable',
            writable: key.isWritable,
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
        programId,
    };
}

export function intoParsedTransaction(
    transactionInstruction: TransactionInstruction,
    versionedMessage: VersionedMessage
): ParsedTransaction {
    const { keys } = transactionInstruction;
    const { addressTableLookups, recentBlockhash } = versionedMessage;

    const parsedMessage: ParsedMessage = {
        accountKeys: convertAccountKeysToParsedMessageAccounts(keys),
        addressTableLookups,
        // at this moment we do not parse instructions as they are not required to represent the transaction. that's why array is empty
        instructions: [],
        recentBlockhash,
    };

    return {
        message: parsedMessage,
        signatures: [],
    };
}

export function upcastAccountMeta({ pubkey, isSigner, isWritable }: LegacyAccountMeta): AccountMeta {
    return {
        address: address(pubkey.toBase58()),
        role: isSigner
            ? isWritable
                ? AccountRole.WRITABLE_SIGNER
                : AccountRole.READONLY_SIGNER
            : isWritable
            ? AccountRole.WRITABLE
            : AccountRole.READONLY,
    };
}

export function upcastTransactionInstruction(ix: TransactionInstruction) {
    return {
        accounts: ix.keys.map(upcastAccountMeta),
        data: ix.data,
        programAddress: address(ix.programId.toBase58()),
    };
}

/**
 * Wrap instruction into format compatible with @solana-program/token library' parsers.
 */
type TAccount = NonNullable<AccountMeta>;
type TInstruction = Instruction<string> &
    InstructionWithAccounts<readonly TAccount[]> &
    InstructionWithData<Uint8Array>;
export function intoInstructionData(instruction: TransactionInstruction): TInstruction {
    return upcastTransactionInstruction(instruction);
}

export const privateIntoParsedData = intoParsedData;

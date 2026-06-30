import {
    type AdvanceNonceInfo,
    AdvanceNonceInfo as AdvanceNonceInfoStruct,
    type AllocateInfo,
    AllocateInfo as AllocateInfoStruct,
    type AllocateWithSeedInfo,
    AllocateWithSeedInfo as AllocateWithSeedInfoStruct,
    type AssignInfo,
    AssignInfo as AssignInfoStruct,
    type AssignWithSeedInfo,
    AssignWithSeedInfo as AssignWithSeedInfoStruct,
    type AuthorizeNonceInfo,
    AuthorizeNonceInfo as AuthorizeNonceInfoStruct,
    type CreateAccountInfo,
    CreateAccountInfo as CreateAccountInfoStruct,
    type CreateAccountWithSeedInfo,
    CreateAccountWithSeedInfo as CreateAccountWithSeedInfoStruct,
    type InitializeNonceInfo,
    InitializeNonceInfo as InitializeNonceInfoStruct,
    type TransferInfo,
    TransferInfo as TransferInfoStruct,
    type TransferWithSeedInfo,
    TransferWithSeedInfo as TransferWithSeedInfoStruct,
    type UpgradeNonceInfo,
    UpgradeNonceInfo as UpgradeNonceInfoStruct,
    type WithdrawNonceInfo,
    WithdrawNonceInfo as WithdrawNonceInfoStruct,
} from '@components/instruction/system/types';
import type { ParserProgramLabel } from '@entities/instruction-parser';
import { type ParsedInstruction, PublicKey } from '@solana/web3.js';
import {
    getCreateAccountWithSeedInstructionDataDecoder,
    identifySystemInstruction,
    parseAdvanceNonceAccountInstruction,
    parseAllocateInstruction,
    parseAllocateWithSeedInstruction,
    parseAssignInstruction,
    parseAssignWithSeedInstruction,
    parseAuthorizeNonceAccountInstruction,
    parseCreateAccountInstruction,
    parseInitializeNonceAccountInstruction,
    parseTransferSolInstruction,
    parseTransferSolWithSeedInstruction,
    parseUpgradeNonceAccountInstruction,
    parseWithdrawNonceAccountInstruction,
    SystemInstruction,
} from '@solana-program/system';
import { create } from 'superstruct';

import type { KitInstruction } from '@/app/shared/lib/web3js-compat';

/** RPC `parsed.program` discriminator for the System program; also the slice's `programLabel`. */
export const SYSTEM_PROGRAM_LABEL = 'system' satisfies ParserProgramLabel;

/**
 * Canonical shape of a parsed System Program instruction. Both the inspector
 * (raw bytes path) and the tx page (RPC pre-parsed path) normalise to this
 * shape via `parseSystemInstruction` / `parseSystemRpcInstruction`.
 */
export type SystemParsed =
    | { type: 'createAccount'; info: CreateAccountInfo }
    | { type: 'createAccountWithSeed'; info: CreateAccountWithSeedInfo }
    | { type: 'allocate'; info: AllocateInfo }
    | { type: 'allocateWithSeed'; info: AllocateWithSeedInfo }
    | { type: 'assign'; info: AssignInfo }
    | { type: 'assignWithSeed'; info: AssignWithSeedInfo }
    | { type: 'transfer'; info: TransferInfo }
    | { type: 'transferWithSeed'; info: TransferWithSeedInfo }
    | { type: 'advanceNonce'; info: AdvanceNonceInfo }
    | { type: 'withdrawNonce'; info: WithdrawNonceInfo }
    | { type: 'authorizeNonce'; info: AuthorizeNonceInfo }
    | { type: 'initializeNonce'; info: InitializeNonceInfo }
    | { type: 'upgradeNonce'; info: UpgradeNonceInfo };

export function parseSystemInstruction(ix: KitInstruction): SystemParsed | undefined {
    try {
        const instructionType = identifySystemInstruction(ix.data);

        switch (instructionType) {
            case SystemInstruction.CreateAccount:
                return {
                    info: toCreateAccountInfo(parseCreateAccountInstruction(ix)),
                    type: 'createAccount',
                };
            case SystemInstruction.CreateAccountWithSeed:
                return {
                    info: parseCreateAccountWithSeed(ix),
                    type: 'createAccountWithSeed',
                };
            case SystemInstruction.Allocate:
                return {
                    info: toAllocateInfo(parseAllocateInstruction(ix)),
                    type: 'allocate',
                };
            case SystemInstruction.AllocateWithSeed:
                return {
                    info: toAllocateWithSeedInfo(parseAllocateWithSeedInstruction(ix)),
                    type: 'allocateWithSeed',
                };
            case SystemInstruction.Assign:
                return {
                    info: toAssignInfo(parseAssignInstruction(ix)),
                    type: 'assign',
                };
            case SystemInstruction.AssignWithSeed:
                return {
                    info: toAssignWithSeedInfo(parseAssignWithSeedInstruction(ix)),
                    type: 'assignWithSeed',
                };
            case SystemInstruction.TransferSol:
                return {
                    info: toTransferInfo(parseTransferSolInstruction(ix)),
                    type: 'transfer',
                };
            case SystemInstruction.AdvanceNonceAccount:
                return {
                    info: toAdvanceNonceInfo(parseAdvanceNonceAccountInstruction(ix)),
                    type: 'advanceNonce',
                };
            case SystemInstruction.WithdrawNonceAccount:
                return {
                    info: toWithdrawNonceInfo(parseWithdrawNonceAccountInstruction(ix)),
                    type: 'withdrawNonce',
                };
            case SystemInstruction.AuthorizeNonceAccount:
                return {
                    info: toAuthorizeNonceInfo(parseAuthorizeNonceAccountInstruction(ix)),
                    type: 'authorizeNonce',
                };
            case SystemInstruction.InitializeNonceAccount:
                return {
                    info: toInitializeNonceInfo(parseInitializeNonceAccountInstruction(ix)),
                    type: 'initializeNonce',
                };
            case SystemInstruction.TransferSolWithSeed:
                return {
                    info: toTransferWithSeedInfo(parseTransferSolWithSeedInstruction(ix)),
                    type: 'transferWithSeed',
                };
            case SystemInstruction.UpgradeNonceAccount:
                return {
                    info: toUpgradeNonceInfo(parseUpgradeNonceAccountInstruction(ix)),
                    type: 'upgradeNonce',
                };
            default:
                return undefined;
        }
    } catch {
        return undefined;
    }
}

/**
 * Normalise an RPC-pre-parsed ParsedInstruction into the slice's canonical
 * `SystemParsed` shape. Uses the same superstruct validators the cards used
 * to call directly — `create()` coerces RPC's string pubkeys into PublicKey
 * instances. Returns undefined when the input isn't a recognised system
 * instruction, which causes the dispatcher to pass RPC's value through
 * unchanged so the tx-page render is preserved.
 */
export function parseSystemRpcInstruction(ix: ParsedInstruction): SystemParsed | undefined {
    if (ix.program !== SYSTEM_PROGRAM_LABEL) return undefined;
    try {
        switch (ix.parsed.type) {
            case 'createAccount':
                return { info: create(ix.parsed.info, CreateAccountInfoStruct), type: 'createAccount' };
            case 'createAccountWithSeed':
                return {
                    info: create(ix.parsed.info, CreateAccountWithSeedInfoStruct),
                    type: 'createAccountWithSeed',
                };
            case 'allocate':
                return { info: create(ix.parsed.info, AllocateInfoStruct), type: 'allocate' };
            case 'allocateWithSeed':
                return { info: create(ix.parsed.info, AllocateWithSeedInfoStruct), type: 'allocateWithSeed' };
            case 'assign':
                return { info: create(ix.parsed.info, AssignInfoStruct), type: 'assign' };
            case 'assignWithSeed':
                return { info: create(ix.parsed.info, AssignWithSeedInfoStruct), type: 'assignWithSeed' };
            case 'transfer':
                return { info: create(ix.parsed.info, TransferInfoStruct), type: 'transfer' };
            case 'transferWithSeed':
                return { info: create(ix.parsed.info, TransferWithSeedInfoStruct), type: 'transferWithSeed' };
            case 'advanceNonce':
                return { info: create(ix.parsed.info, AdvanceNonceInfoStruct), type: 'advanceNonce' };
            case 'withdrawNonce':
                return { info: create(ix.parsed.info, WithdrawNonceInfoStruct), type: 'withdrawNonce' };
            case 'authorizeNonce':
                return { info: create(ix.parsed.info, AuthorizeNonceInfoStruct), type: 'authorizeNonce' };
            case 'initializeNonce':
                return { info: create(ix.parsed.info, InitializeNonceInfoStruct), type: 'initializeNonce' };
            case 'upgradeNonce':
                return { info: create(ix.parsed.info, UpgradeNonceInfoStruct), type: 'upgradeNonce' };
            default:
                return undefined;
        }
    } catch {
        return undefined;
    }
}

function toCreateAccountInfo(parsed: ReturnType<typeof parseCreateAccountInstruction>): CreateAccountInfo {
    return {
        lamports: safeNumber(parsed.data.lamports),
        newAccount: new PublicKey(parsed.accounts.newAccount.address),
        owner: new PublicKey(parsed.data.programAddress),
        source: new PublicKey(parsed.accounts.payer.address),
        space: safeNumber(parsed.data.space),
    };
}

/**
 * CreateAccountWithSeed has a 2-account variant when payer === baseAccount,
 * in which case @solana-program/system's parser throws "Not enough accounts".
 * Decode the base from instruction data and read accounts directly so both
 * variants work.
 */
function parseCreateAccountWithSeed(ix: KitInstruction): CreateAccountWithSeedInfo {
    const decoded = getCreateAccountWithSeedInstructionDataDecoder().decode(ix.data);
    return {
        base: new PublicKey(decoded.base.toString()),
        lamports: safeNumber(decoded.amount),
        newAccount: new PublicKey(ix.accounts[1].address),
        owner: new PublicKey(decoded.programAddress.toString()),
        seed: decoded.seed,
        source: new PublicKey(ix.accounts[0].address),
        space: safeNumber(decoded.space),
    };
}

function toAllocateInfo(parsed: ReturnType<typeof parseAllocateInstruction>): AllocateInfo {
    return {
        // @solana-program/system names this account `newAccount`; the RPC-pre-parsed
        // shape calls it `account`. Same underlying pubkey.
        account: new PublicKey(parsed.accounts.newAccount.address),
        space: safeNumber(parsed.data.space),
    };
}

function toAllocateWithSeedInfo(parsed: ReturnType<typeof parseAllocateWithSeedInstruction>): AllocateWithSeedInfo {
    return {
        // @solana-program/system names this `newAccount`; RPC pre-parsed shape uses `account`.
        account: new PublicKey(parsed.accounts.newAccount.address),
        base: new PublicKey(parsed.accounts.baseAccount.address),
        owner: new PublicKey(parsed.data.programAddress),
        seed: parsed.data.seed,
        space: safeNumber(parsed.data.space),
    };
}

function toAssignInfo(parsed: ReturnType<typeof parseAssignInstruction>): AssignInfo {
    return {
        account: new PublicKey(parsed.accounts.account.address),
        owner: new PublicKey(parsed.data.programAddress),
    };
}

function toAssignWithSeedInfo(parsed: ReturnType<typeof parseAssignWithSeedInstruction>): AssignWithSeedInfo {
    return {
        account: new PublicKey(parsed.accounts.account.address),
        base: new PublicKey(parsed.accounts.baseAccount.address),
        owner: new PublicKey(parsed.data.programAddress),
        seed: parsed.data.seed,
    };
}

function toTransferInfo(parsed: ReturnType<typeof parseTransferSolInstruction>): TransferInfo {
    return {
        destination: new PublicKey(parsed.accounts.destination.address),
        lamports: safeNumber(parsed.data.amount),
        source: new PublicKey(parsed.accounts.source.address),
    };
}

function toAdvanceNonceInfo(parsed: ReturnType<typeof parseAdvanceNonceAccountInstruction>): AdvanceNonceInfo {
    return {
        nonceAccount: new PublicKey(parsed.accounts.nonceAccount.address),
        nonceAuthority: new PublicKey(parsed.accounts.nonceAuthority.address),
    };
}

function toWithdrawNonceInfo(parsed: ReturnType<typeof parseWithdrawNonceAccountInstruction>): WithdrawNonceInfo {
    return {
        destination: new PublicKey(parsed.accounts.recipientAccount.address),
        lamports: safeNumber(parsed.data.withdrawAmount),
        nonceAccount: new PublicKey(parsed.accounts.nonceAccount.address),
        nonceAuthority: new PublicKey(parsed.accounts.nonceAuthority.address),
    };
}

function toAuthorizeNonceInfo(parsed: ReturnType<typeof parseAuthorizeNonceAccountInstruction>): AuthorizeNonceInfo {
    return {
        newAuthorized: new PublicKey(parsed.data.newNonceAuthority),
        nonceAccount: new PublicKey(parsed.accounts.nonceAccount.address),
        nonceAuthority: new PublicKey(parsed.accounts.nonceAuthority.address),
    };
}

function toInitializeNonceInfo(parsed: ReturnType<typeof parseInitializeNonceAccountInstruction>): InitializeNonceInfo {
    return {
        nonceAccount: new PublicKey(parsed.accounts.nonceAccount.address),
        nonceAuthority: new PublicKey(parsed.data.nonceAuthority),
    };
}

function toTransferWithSeedInfo(parsed: ReturnType<typeof parseTransferSolWithSeedInstruction>): TransferWithSeedInfo {
    return {
        destination: new PublicKey(parsed.accounts.destination.address),
        lamports: safeNumber(parsed.data.amount),
        source: new PublicKey(parsed.accounts.source.address),
        sourceBase: new PublicKey(parsed.accounts.baseAccount.address),
        sourceOwner: new PublicKey(parsed.data.fromOwner),
        sourceSeed: parsed.data.fromSeed,
    };
}

function toUpgradeNonceInfo(parsed: ReturnType<typeof parseUpgradeNonceAccountInstruction>): UpgradeNonceInfo {
    return {
        nonceAccount: new PublicKey(parsed.accounts.nonceAccount.address),
    };
}

function safeNumber(value: bigint | number): number {
    return Number(value);
}

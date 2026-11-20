import {
    getCreateAccountWithSeedInstructionDataDecoder,
    identifySystemInstruction,
    parseAdvanceNonceAccountInstruction,
    parseAllocateInstruction,
    parseAllocateWithSeedInstruction,
    parseAssignInstruction,
    parseAssignWithSeedInstruction,
    parseAuthorizeNonceAccountInstruction,
    parseCreateAccountAllowPrefundInstruction,
    parseCreateAccountInstruction,
    parseInitializeNonceAccountInstruction,
    parseTransferSolInstruction,
    parseTransferSolWithSeedInstruction,
    parseUpgradeNonceAccountInstruction,
    parseWithdrawNonceAccountInstruction,
    SystemInstruction,
} from '@solana-program/system';
import type { Infer } from 'superstruct';

import type { KitInstruction } from '../../kit-instruction.js';
import { isParsedInstructionProgram, SYSTEM_PROGRAM_LABEL } from '../../program-registry.js';
import {
    AdvanceNonceInfo,
    AllocateInfo,
    AllocateWithSeedInfo,
    AssignInfo,
    AssignWithSeedInfo,
    AuthorizeNonceInfo,
    CreateAccountAllowPrefundInfo,
    CreateAccountInfo,
    CreateAccountWithSeedInfo,
    InitializeNonceInfo,
    TransferInfo,
    TransferWithSeedInfo,
    UpgradeNonceInfo,
    WithdrawNonceInfo,
} from './validators.js';

const INFO_BY_TYPE = {
    advanceNonce: AdvanceNonceInfo,
    allocate: AllocateInfo,
    allocateWithSeed: AllocateWithSeedInfo,
    assign: AssignInfo,
    assignWithSeed: AssignWithSeedInfo,
    authorizeNonce: AuthorizeNonceInfo,
    createAccount: CreateAccountInfo,
    createAccountAllowPrefund: CreateAccountAllowPrefundInfo,
    createAccountWithSeed: CreateAccountWithSeedInfo,
    initializeNonce: InitializeNonceInfo,
    transfer: TransferInfo,
    transferWithSeed: TransferWithSeedInfo,
    upgradeNonce: UpgradeNonceInfo,
    withdrawFromNonce: WithdrawNonceInfo,
};

type SystemInstructionType = keyof typeof INFO_BY_TYPE;

/** Shape of a parsed System Program instruction on the byte path and on the RPC path. */
export type SystemParsed = {
    [T in SystemInstructionType]: { type: T; info: Infer<(typeof INFO_BY_TYPE)[T]> };
}[SystemInstructionType];

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
            case SystemInstruction.CreateAccountAllowPrefund:
                return {
                    info: toCreateAccountAllowPrefundInfo(parseCreateAccountAllowPrefundInstruction(ix)),
                    type: 'createAccountAllowPrefund',
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
                    type: 'withdrawFromNonce',
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

export function parseSystemRpcInstruction(ix: { program: string; parsed: unknown }): SystemParsed | undefined {
    if (!isParsedInstructionProgram(ix, SYSTEM_PROGRAM_LABEL)) return undefined;
    return isSystemParsed(ix.parsed) ? ix.parsed : undefined;
}

function isSystemParsed(value: unknown): value is SystemParsed {
    if (typeof value !== 'object' || value === null || !('type' in value) || !('info' in value)) return false;
    return isSystemInstructionType(value.type) && INFO_BY_TYPE[value.type].is(value.info);
}

function isSystemInstructionType(type: unknown): type is SystemInstructionType {
    return typeof type === 'string' && Object.prototype.hasOwnProperty.call(INFO_BY_TYPE, type);
}

function toCreateAccountInfo(parsed: ReturnType<typeof parseCreateAccountInstruction>): CreateAccountInfo {
    return {
        lamports: safeNumber(parsed.data.lamports),
        newAccount: parsed.accounts.newAccount.address,
        owner: parsed.data.programAddress,
        source: parsed.accounts.payer.address,
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
        base: decoded.base,
        lamports: safeNumber(decoded.amount),
        newAccount: ix.accounts[1].address,
        owner: decoded.programAddress,
        seed: decoded.seed,
        source: ix.accounts[0].address,
        space: safeNumber(decoded.space),
    };
}

// Matches the RPC, which reads the payer only when lamports is non-zero.
function toCreateAccountAllowPrefundInfo(
    parsed: ReturnType<typeof parseCreateAccountAllowPrefundInstruction>,
): CreateAccountAllowPrefundInfo {
    const { data, accounts } = parsed;
    const info = {
        newAccount: accounts.newAccount.address,
        owner: data.programAddress,
        space: safeNumber(data.space),
    };
    if (data.lamports === 0n) return info;
    if (!accounts.payer) throw new Error('CreateAccountAllowPrefund moves lamports without a payer');
    return { ...info, lamports: safeNumber(data.lamports), source: accounts.payer.address };
}

function toAllocateInfo(parsed: ReturnType<typeof parseAllocateInstruction>): AllocateInfo {
    return {
        // @solana-program/system names this account `newAccount`; the RPC-pre-parsed
        // shape calls it `account`. Same underlying pubkey.
        account: parsed.accounts.newAccount.address,
        space: safeNumber(parsed.data.space),
    };
}

function toAllocateWithSeedInfo(parsed: ReturnType<typeof parseAllocateWithSeedInstruction>): AllocateWithSeedInfo {
    return {
        // @solana-program/system names this `newAccount`; RPC pre-parsed shape uses `account`.
        account: parsed.accounts.newAccount.address,
        base: parsed.accounts.baseAccount.address,
        owner: parsed.data.programAddress,
        seed: parsed.data.seed,
        space: safeNumber(parsed.data.space),
    };
}

function toAssignInfo(parsed: ReturnType<typeof parseAssignInstruction>): AssignInfo {
    return {
        account: parsed.accounts.account.address,
        owner: parsed.data.programAddress,
    };
}

function toAssignWithSeedInfo(parsed: ReturnType<typeof parseAssignWithSeedInstruction>): AssignWithSeedInfo {
    return {
        account: parsed.accounts.account.address,
        base: parsed.accounts.baseAccount.address,
        owner: parsed.data.programAddress,
        seed: parsed.data.seed,
    };
}

function toTransferInfo(parsed: ReturnType<typeof parseTransferSolInstruction>): TransferInfo {
    return {
        destination: parsed.accounts.destination.address,
        lamports: safeNumber(parsed.data.amount),
        source: parsed.accounts.source.address,
    };
}

function toAdvanceNonceInfo(parsed: ReturnType<typeof parseAdvanceNonceAccountInstruction>): AdvanceNonceInfo {
    return {
        nonceAccount: parsed.accounts.nonceAccount.address,
        nonceAuthority: parsed.accounts.nonceAuthority.address,
    };
}

function toWithdrawNonceInfo(parsed: ReturnType<typeof parseWithdrawNonceAccountInstruction>): WithdrawNonceInfo {
    return {
        destination: parsed.accounts.recipientAccount.address,
        lamports: safeNumber(parsed.data.withdrawAmount),
        nonceAccount: parsed.accounts.nonceAccount.address,
        nonceAuthority: parsed.accounts.nonceAuthority.address,
    };
}

function toAuthorizeNonceInfo(parsed: ReturnType<typeof parseAuthorizeNonceAccountInstruction>): AuthorizeNonceInfo {
    return {
        newAuthorized: parsed.data.newNonceAuthority,
        nonceAccount: parsed.accounts.nonceAccount.address,
        nonceAuthority: parsed.accounts.nonceAuthority.address,
    };
}

function toInitializeNonceInfo(parsed: ReturnType<typeof parseInitializeNonceAccountInstruction>): InitializeNonceInfo {
    return {
        nonceAccount: parsed.accounts.nonceAccount.address,
        nonceAuthority: parsed.data.nonceAuthority,
    };
}

function toTransferWithSeedInfo(parsed: ReturnType<typeof parseTransferSolWithSeedInstruction>): TransferWithSeedInfo {
    return {
        destination: parsed.accounts.destination.address,
        lamports: safeNumber(parsed.data.amount),
        source: parsed.accounts.source.address,
        sourceBase: parsed.accounts.baseAccount.address,
        sourceOwner: parsed.data.fromOwner,
        sourceSeed: parsed.data.fromSeed,
    };
}

function toUpgradeNonceInfo(parsed: ReturnType<typeof parseUpgradeNonceAccountInstruction>): UpgradeNonceInfo {
    return {
        nonceAccount: parsed.accounts.nonceAccount.address,
    };
}

// Number(bigint) loses precision above 2^53 for lamports/space. Kept verbatim from the app card
// port; widening the validators to a string fallback (cf. entity-inspector's SafeNumeric) is a
// separate decision that ripples to every app consumer of the parsed shape.
function safeNumber(value: bigint | number): number {
    return Number(value);
}

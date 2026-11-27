import { address, createNoopSigner } from '@solana/kit';
import {
    getAdvanceNonceAccountInstruction,
    getAllocateInstruction,
    getAllocateWithSeedInstruction,
    getAssignInstruction,
    getAssignWithSeedInstruction,
    getAuthorizeNonceAccountInstruction,
    getCreateAccountAllowPrefundInstruction,
    getCreateAccountInstruction,
    getCreateAccountWithSeedInstruction,
    getInitializeNonceAccountInstruction,
    getTransferSolInstruction,
    getTransferSolWithSeedInstruction,
    getUpgradeNonceAccountInstruction,
    getWithdrawNonceAccountInstruction,
} from '@solana-program/system';
import { describe, expect, it } from 'vitest';

import { gen } from '../../../__tests__/gen.js';
import type { KitInstruction } from '../../../kit-instruction.js';
import { parseSystemInstruction, parseSystemRpcInstruction, type SystemParsed } from '../parser.js';

const A = gen.wrappedSol;
const B = gen.sysvarRent;
const C = gen.sysvarClock;
const OWNER = gen.tokenProgram;
const SYSTEM = gen.systemProgram;

function toKitIx(ix: unknown): KitInstruction {
    return ix as KitInstruction;
}

const byteCases: { name: string; instruction: unknown; expected: SystemParsed }[] = [
    {
        expected: {
            info: {
                lamports: 100,
                newAccount: B,
                owner: OWNER,
                source: A,
                space: 10,
            },
            type: 'createAccount',
        },
        instruction: getCreateAccountInstruction({
            lamports: 100n,
            newAccount: createNoopSigner(address(B)),
            payer: createNoopSigner(address(A)),
            programAddress: address(OWNER),
            space: 10n,
        }),
        name: 'createAccount',
    },
    {
        expected: {
            info: {
                base: C,
                lamports: 100,
                newAccount: B,
                owner: OWNER,
                seed: 'seed',
                source: A,
                space: 10,
            },
            type: 'createAccountWithSeed',
        },
        instruction: getCreateAccountWithSeedInstruction({
            amount: 100n,
            base: address(C),
            baseAccount: createNoopSigner(address(C)),
            newAccount: address(B),
            payer: createNoopSigner(address(A)),
            programAddress: address(OWNER),
            seed: 'seed',
            space: 10n,
        }),
        name: 'createAccountWithSeed',
    },
    {
        expected: {
            info: {
                lamports: 100,
                newAccount: B,
                owner: OWNER,
                source: A,
                space: 10,
            },
            type: 'createAccountAllowPrefund',
        },
        instruction: getCreateAccountAllowPrefundInstruction({
            lamports: 100n,
            newAccount: createNoopSigner(address(B)),
            payer: createNoopSigner(address(A)),
            programAddress: address(OWNER),
            space: 10n,
        }),
        name: 'createAccountAllowPrefund with lamports',
    },
    {
        expected: {
            info: { newAccount: B, owner: OWNER, space: 10 },
            type: 'createAccountAllowPrefund',
        },
        instruction: getCreateAccountAllowPrefundInstruction({
            newAccount: createNoopSigner(address(B)),
            programAddress: address(OWNER),
            space: 10n,
        }),
        name: 'createAccountAllowPrefund without lamports',
    },
    {
        expected: {
            info: { newAccount: B, owner: OWNER, space: 10 },
            type: 'createAccountAllowPrefund',
        },
        instruction: getCreateAccountAllowPrefundInstruction({
            lamports: 0n,
            newAccount: createNoopSigner(address(B)),
            payer: createNoopSigner(address(A)),
            programAddress: address(OWNER),
            space: 10n,
        }),
        name: 'createAccountAllowPrefund with zero lamports and a payer',
    },
    {
        expected: {
            info: { account: A, space: 10 },
            type: 'allocate',
        },
        instruction: getAllocateInstruction({ newAccount: createNoopSigner(address(A)), space: 10n }),
        name: 'allocate',
    },
    {
        expected: {
            info: {
                account: A,
                base: B,
                owner: OWNER,
                seed: 'seed',
                space: 10,
            },
            type: 'allocateWithSeed',
        },
        instruction: getAllocateWithSeedInstruction({
            base: address(B),
            baseAccount: createNoopSigner(address(B)),
            newAccount: address(A),
            programAddress: address(OWNER),
            seed: 'seed',
            space: 10n,
        }),
        name: 'allocateWithSeed',
    },
    {
        expected: {
            info: { account: A, owner: OWNER },
            type: 'assign',
        },
        instruction: getAssignInstruction({
            account: createNoopSigner(address(A)),
            programAddress: address(OWNER),
        }),
        name: 'assign',
    },
    {
        expected: {
            info: {
                account: A,
                base: B,
                owner: OWNER,
                seed: 'seed',
            },
            type: 'assignWithSeed',
        },
        instruction: getAssignWithSeedInstruction({
            account: address(A),
            base: address(B),
            baseAccount: createNoopSigner(address(B)),
            programAddress: address(OWNER),
            seed: 'seed',
        }),
        name: 'assignWithSeed',
    },
    {
        expected: {
            info: { destination: B, lamports: 42, source: A },
            type: 'transfer',
        },
        instruction: getTransferSolInstruction({
            amount: 42n,
            destination: address(B),
            source: createNoopSigner(address(A)),
        }),
        name: 'transfer',
    },
    {
        expected: {
            info: {
                destination: B,
                lamports: 42,
                source: A,
                sourceBase: C,
                sourceOwner: OWNER,
                sourceSeed: 'seed',
            },
            type: 'transferWithSeed',
        },
        instruction: getTransferSolWithSeedInstruction({
            amount: 42n,
            baseAccount: createNoopSigner(address(C)),
            destination: address(B),
            fromOwner: address(OWNER),
            fromSeed: 'seed',
            source: address(A),
        }),
        name: 'transferWithSeed',
    },
    {
        expected: {
            info: { nonceAccount: A, nonceAuthority: B },
            type: 'advanceNonce',
        },
        instruction: getAdvanceNonceAccountInstruction({
            nonceAccount: address(A),
            nonceAuthority: createNoopSigner(address(B)),
        }),
        name: 'advanceNonce',
    },
    {
        expected: {
            info: {
                destination: C,
                lamports: 42,
                nonceAccount: A,
                nonceAuthority: B,
            },
            type: 'withdrawFromNonce',
        },
        instruction: getWithdrawNonceAccountInstruction({
            nonceAccount: address(A),
            nonceAuthority: createNoopSigner(address(B)),
            recipientAccount: address(C),
            withdrawAmount: 42n,
        }),
        name: 'withdrawFromNonce',
    },
    {
        expected: {
            info: {
                newAuthorized: C,
                nonceAccount: A,
                nonceAuthority: B,
            },
            type: 'authorizeNonce',
        },
        instruction: getAuthorizeNonceAccountInstruction({
            newNonceAuthority: address(C),
            nonceAccount: address(A),
            nonceAuthority: createNoopSigner(address(B)),
        }),
        name: 'authorizeNonce',
    },
    {
        expected: {
            info: { nonceAccount: A, nonceAuthority: B },
            type: 'initializeNonce',
        },
        instruction: getInitializeNonceAccountInstruction({
            nonceAccount: address(A),
            nonceAuthority: address(B),
        }),
        name: 'initializeNonce',
    },
    {
        expected: {
            info: { nonceAccount: A },
            type: 'upgradeNonce',
        },
        instruction: getUpgradeNonceAccountInstruction({ nonceAccount: address(A) }),
        name: 'upgradeNonce',
    },
];

describe('parseSystemInstruction (byte path)', () => {
    it.each(byteCases)('should decode $name from instruction bytes', ({ instruction, expected }) => {
        expect(parseSystemInstruction(toKitIx(instruction))).toEqual(expected);
    });

    it('should return undefined for createAccountAllowPrefund that moves lamports without a payer', () => {
        const instruction = getCreateAccountAllowPrefundInstruction({
            lamports: 100n,
            newAccount: createNoopSigner(address(B)),
            programAddress: address(OWNER),
            space: 10n,
        });

        expect(parseSystemInstruction(toKitIx(instruction))).toBeUndefined();
    });

    it('should return undefined for an unrecognized discriminator', () => {
        expect(
            parseSystemInstruction(
                toKitIx({ accounts: [], data: new Uint8Array([250, 0, 0, 0]), programAddress: SYSTEM }),
            ),
        ).toBeUndefined();
    });

    it('should return undefined for empty instruction data', () => {
        expect(
            parseSystemInstruction(toKitIx({ accounts: [], data: new Uint8Array(), programAddress: SYSTEM })),
        ).toBeUndefined();
    });
});

const RECENT_BLOCKHASHES_SYSVAR = 'SysvarRecentB1ockHashes11111111111111111111';
const RENT_SYSVAR = 'SysvarRent111111111111111111111111111111111';

const rpcCases: { type: string; info: Record<string, unknown> }[] = [
    { info: { destination: B, lamports: 42, source: A }, type: 'transfer' },
    {
        info: {
            destination: C,
            lamports: 42,
            nonceAccount: A,
            nonceAuthority: B,
            recentBlockhashesSysvar: RECENT_BLOCKHASHES_SYSVAR,
            rentSysvar: RENT_SYSVAR,
        },
        type: 'withdrawFromNonce',
    },
    { info: { newAccount: B, owner: OWNER, space: 10 }, type: 'createAccountAllowPrefund' },
];

function rpcInstruction(program: string, type: string, info: unknown) {
    return { parsed: { info, type }, program, programId: SYSTEM } as never;
}

describe('parseSystemRpcInstruction (RPC-parsed path)', () => {
    it.each(rpcCases)('should accept $type from RPC-parsed info', ({ type, info }) => {
        expect(parseSystemRpcInstruction(rpcInstruction('system', type, info))).toEqual({ info, type });
    });

    it('should reject instructions from other programs', () => {
        expect(
            parseSystemRpcInstruction(
                rpcInstruction('spl-token', 'transfer', { destination: B, lamports: 1, source: A }),
            ),
        ).toBeUndefined();
    });

    it('should return undefined for unrecognized instruction types', () => {
        // `toString` is a key of Object.prototype.
        const types = ['somethingNew', 'toString'];

        expect(types.map(type => parseSystemRpcInstruction(rpcInstruction('system', type, {})))).toEqual([
            undefined,
            undefined,
        ]);
    });

    it('should return undefined when the info fails validation', () => {
        expect(
            parseSystemRpcInstruction(
                rpcInstruction('system', 'transfer', { destination: B, lamports: 'x', source: A }),
            ),
        ).toBeUndefined();
    });

    it('should return undefined for createAccountAllowPrefund with lamports and no source', () => {
        expect(
            parseSystemRpcInstruction(
                rpcInstruction('system', 'createAccountAllowPrefund', {
                    lamports: 100,
                    newAccount: B,
                    owner: OWNER,
                    space: 10,
                }),
            ),
        ).toBeUndefined();
    });

    it('should return undefined when parsed is not a type and info pair', () => {
        const notPairs = ['transfer', null, { type: 'transfer' }, { info: {} }];

        expect(notPairs.map(parsed => parseSystemRpcInstruction({ parsed, program: 'system' }))).toEqual([
            undefined,
            undefined,
            undefined,
            undefined,
        ]);
    });
});

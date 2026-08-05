import { address, createNoopSigner } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import {
    getAdvanceNonceAccountInstruction,
    getAllocateInstruction,
    getAllocateWithSeedInstruction,
    getAssignInstruction,
    getAssignWithSeedInstruction,
    getAuthorizeNonceAccountInstruction,
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
                newAccount: new PublicKey(B),
                owner: new PublicKey(OWNER),
                source: new PublicKey(A),
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
                base: new PublicKey(C),
                lamports: 100,
                newAccount: new PublicKey(B),
                owner: new PublicKey(OWNER),
                seed: 'seed',
                source: new PublicKey(A),
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
            info: { account: new PublicKey(A), space: 10 },
            type: 'allocate',
        },
        instruction: getAllocateInstruction({ newAccount: createNoopSigner(address(A)), space: 10n }),
        name: 'allocate',
    },
    {
        expected: {
            info: {
                account: new PublicKey(A),
                base: new PublicKey(B),
                owner: new PublicKey(OWNER),
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
            info: { account: new PublicKey(A), owner: new PublicKey(OWNER) },
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
                account: new PublicKey(A),
                base: new PublicKey(B),
                owner: new PublicKey(OWNER),
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
            info: { destination: new PublicKey(B), lamports: 42, source: new PublicKey(A) },
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
                destination: new PublicKey(B),
                lamports: 42,
                source: new PublicKey(A),
                sourceBase: new PublicKey(C),
                sourceOwner: new PublicKey(OWNER),
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
            info: { nonceAccount: new PublicKey(A), nonceAuthority: new PublicKey(B) },
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
                destination: new PublicKey(C),
                lamports: 42,
                nonceAccount: new PublicKey(A),
                nonceAuthority: new PublicKey(B),
            },
            type: 'withdrawNonce',
        },
        instruction: getWithdrawNonceAccountInstruction({
            nonceAccount: address(A),
            nonceAuthority: createNoopSigner(address(B)),
            recipientAccount: address(C),
            withdrawAmount: 42n,
        }),
        name: 'withdrawNonce',
    },
    {
        expected: {
            info: {
                newAuthorized: new PublicKey(C),
                nonceAccount: new PublicKey(A),
                nonceAuthority: new PublicKey(B),
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
            info: { nonceAccount: new PublicKey(A), nonceAuthority: new PublicKey(B) },
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
            info: { nonceAccount: new PublicKey(A) },
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

const rpcCases: { type: string; info: Record<string, unknown>; expectedInfo: Record<string, unknown> }[] = [
    {
        expectedInfo: {
            lamports: 100,
            newAccount: new PublicKey(B),
            owner: new PublicKey(OWNER),
            source: new PublicKey(A),
            space: 10,
        },
        info: { lamports: 100, newAccount: B, owner: OWNER, source: A, space: 10 },
        type: 'createAccount',
    },
    {
        expectedInfo: {
            base: new PublicKey(C),
            lamports: 100,
            newAccount: new PublicKey(B),
            owner: new PublicKey(OWNER),
            seed: 'seed',
            source: new PublicKey(A),
            space: 10,
        },
        info: { base: C, lamports: 100, newAccount: B, owner: OWNER, seed: 'seed', source: A, space: 10 },
        type: 'createAccountWithSeed',
    },
    {
        expectedInfo: { account: new PublicKey(A), space: 10 },
        info: { account: A, space: 10 },
        type: 'allocate',
    },
    {
        expectedInfo: {
            account: new PublicKey(A),
            base: new PublicKey(B),
            owner: new PublicKey(OWNER),
            seed: 'seed',
            space: 10,
        },
        info: { account: A, base: B, owner: OWNER, seed: 'seed', space: 10 },
        type: 'allocateWithSeed',
    },
    {
        expectedInfo: { account: new PublicKey(A), owner: new PublicKey(OWNER) },
        info: { account: A, owner: OWNER },
        type: 'assign',
    },
    {
        expectedInfo: {
            account: new PublicKey(A),
            base: new PublicKey(B),
            owner: new PublicKey(OWNER),
            seed: 'seed',
        },
        info: { account: A, base: B, owner: OWNER, seed: 'seed' },
        type: 'assignWithSeed',
    },
    {
        expectedInfo: { destination: new PublicKey(B), lamports: 42, source: new PublicKey(A) },
        info: { destination: B, lamports: 42, source: A },
        type: 'transfer',
    },
    {
        expectedInfo: {
            destination: new PublicKey(B),
            lamports: 42,
            source: new PublicKey(A),
            sourceBase: new PublicKey(C),
            sourceOwner: new PublicKey(OWNER),
            sourceSeed: 'seed',
        },
        info: { destination: B, lamports: 42, source: A, sourceBase: C, sourceOwner: OWNER, sourceSeed: 'seed' },
        type: 'transferWithSeed',
    },
    {
        expectedInfo: { nonceAccount: new PublicKey(A), nonceAuthority: new PublicKey(B) },
        info: { nonceAccount: A, nonceAuthority: B },
        type: 'advanceNonce',
    },
    {
        expectedInfo: {
            destination: new PublicKey(C),
            lamports: 42,
            nonceAccount: new PublicKey(A),
            nonceAuthority: new PublicKey(B),
        },
        info: { destination: C, lamports: 42, nonceAccount: A, nonceAuthority: B },
        type: 'withdrawNonce',
    },
    {
        expectedInfo: {
            newAuthorized: new PublicKey(C),
            nonceAccount: new PublicKey(A),
            nonceAuthority: new PublicKey(B),
        },
        info: { newAuthorized: C, nonceAccount: A, nonceAuthority: B },
        type: 'authorizeNonce',
    },
    {
        expectedInfo: { nonceAccount: new PublicKey(A), nonceAuthority: new PublicKey(B) },
        info: { nonceAccount: A, nonceAuthority: B },
        type: 'initializeNonce',
    },
    {
        expectedInfo: { nonceAccount: new PublicKey(A) },
        info: { nonceAccount: A },
        type: 'upgradeNonce',
    },
];

function rpcInstruction(program: string, type: string, info: unknown) {
    return { parsed: { info, type }, program, programId: new PublicKey(SYSTEM) } as never;
}

describe('parseSystemRpcInstruction (RPC-parsed path)', () => {
    it.each(rpcCases)('should normalize $type from RPC-parsed info', ({ type, info, expectedInfo }) => {
        expect(parseSystemRpcInstruction(rpcInstruction('system', type, info))).toEqual({
            info: expectedInfo,
            type,
        });
    });

    it('should reject instructions from other programs', () => {
        expect(
            parseSystemRpcInstruction(
                rpcInstruction('spl-token', 'transfer', { destination: B, lamports: 1, source: A }),
            ),
        ).toBeUndefined();
    });

    it('should return undefined for unrecognized instruction types', () => {
        expect(parseSystemRpcInstruction(rpcInstruction('system', 'somethingNew', {}))).toBeUndefined();
    });

    it('should return undefined when the info fails validation', () => {
        expect(
            parseSystemRpcInstruction(
                rpcInstruction('system', 'transfer', { destination: B, lamports: 'x', source: A }),
            ),
        ).toBeUndefined();
    });
});

import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import { Keypair, TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from '@solana-program/token';
import { describe, expect, it } from 'vitest';

import { toBuffer } from '@/app/shared/lib/bytes';

import { isTokenBatchInstruction, parseBatchInstruction } from '../batch-parser';
import { BATCH_DISCRIMINATOR } from '../const';
import { formatParsedInstruction } from '../format-sub-instruction';
import type { DecodedField, MintInfo } from '../types';
import {
    makeAccount,
    makeApproveCheckedData,
    makeApproveData,
    makeBatchIx,
    makeBatchIxWithKeys,
    makeBurnCheckedData,
    makeBurnData,
    makeFreezeAccountData,
    makeInitializeAccount2Data,
    makeInitializeAccount3Data,
    makeInitializeAccountData,
    makeInitializeMint2Data,
    makeInitializeMintData,
    makeMintToCheckedData,
    makeMintToData,
    makeRevokeData,
    makeSetAuthorityData,
    makeSyncNativeData,
    makeThawAccountData,
    makeTransferCheckedData,
    makeTransferData,
    makeWithdrawExcessLamportsData,
} from './test-utils';

describe('isTokenBatchInstruction', () => {
    it.each([
        {
            data: new Uint8Array([0xff, 3, 9, 3, 0, 0, 0, 0, 0, 0, 0, 1]),
            expected: true,
            label: 'Token Program batch',
            programId: TOKEN_PROGRAM_ID,
        },
        { data: new Uint8Array([0xff]), expected: true, label: 'Token-2022 batch', programId: TOKEN_2022_PROGRAM_ID },
        {
            data: new Uint8Array([3, 0, 0, 0, 0, 0, 0, 0, 1]),
            expected: false,
            label: 'non-batch discriminator',
            programId: TOKEN_PROGRAM_ID,
        },
        {
            data: new Uint8Array([0xff]),
            expected: false,
            label: 'non-token program',
            programId: Keypair.generate().publicKey,
        },
        { data: new Uint8Array(0), expected: false, label: 'empty data', programId: TOKEN_PROGRAM_ID },
    ])('should return $expected for $label', ({ data, programId, expected }) => {
        expect(isTokenBatchInstruction({ data, keys: [], programId })).toBe(expected);
    });
});

describe('parseBatchInstruction', () => {
    it('should parse a single Transfer sub-instruction', () => {
        const ix = makeBatchIx([{ data: makeTransferData(1000n), numAccounts: 3 }], 3);
        const result = parseBatchInstruction(ix);

        expect(result.instructions).toHaveLength(1);
        expect(result.instructions[0].parsed.instructionType).toBe(TokenInstruction.Transfer);
        expect(result.instructions[0].extraSigners).toEqual([]);
    });

    it('should parse multiple sub-instructions', () => {
        const ix = makeBatchIx(
            [
                { data: makeTransferData(100n), numAccounts: 3 },
                { data: makeTransferData(200n), numAccounts: 3 },
                { data: makeTransferData(300n), numAccounts: 3 },
            ],
            9,
        );

        const result = parseBatchInstruction(ix);
        expect(result.instructions).toHaveLength(3);
        expect(result.instructions.every(i => i.parsed.instructionType === TokenInstruction.Transfer)).toBe(true);
    });

    it('should parse mixed instruction types', () => {
        const ix = makeBatchIx(
            [
                { data: makeTransferData(100n), numAccounts: 3 },
                { data: makeTransferCheckedData(200n, 6), numAccounts: 4 },
            ],
            7,
        );

        const result = parseBatchInstruction(ix);
        expect(result.instructions).toHaveLength(2);
        expect(result.instructions[0].parsed.instructionType).toBe(TokenInstruction.Transfer);
        expect(result.instructions[1].parsed.instructionType).toBe(TokenInstruction.TransferChecked);
    });

    it('should extract multisig co-signer accounts as extraSigners', () => {
        // Transfer has 3 named accounts; 2 extra accounts are multisig signers
        const ix = makeBatchIxWithKeys(
            [{ data: makeTransferData(100n), numAccounts: 5 }],
            [
                makeAccount(true, false), // Source (writable)
                makeAccount(true, false), // Destination (writable)
                makeAccount(false, false), // Authority (multisig address, not signer)
                makeAccount(false, true), // Co-signer 1
                makeAccount(false, true), // Co-signer 2
            ],
        );

        const result = parseBatchInstruction(ix);
        expect(result.instructions).toHaveLength(1);
        expect(result.instructions[0].extraSigners).toHaveLength(2);
        expect(result.instructions[0].extraSigners[0].label).toBe('Signer 1');
        expect(result.instructions[0].extraSigners[0].isSigner).toBe(true);
        expect(result.instructions[0].extraSigners[1].label).toBe('Signer 2');
        expect(result.instructions[0].extraSigners[1].isSigner).toBe(true);
    });

    it('should throw on non-batch data', () => {
        const ix = new TransactionInstruction({
            data: toBuffer(new Uint8Array([3, 0, 0, 0])),
            keys: [],
            programId: TOKEN_2022_PROGRAM_ID,
        });

        expect(() => parseBatchInstruction(ix)).toThrow('Not a batch instruction');
    });

    it('should handle empty batch', () => {
        const ix = new TransactionInstruction({
            data: toBuffer(new Uint8Array([BATCH_DISCRIMINATOR])),
            keys: [],
            programId: TOKEN_2022_PROGRAM_ID,
        });

        const result = parseBatchInstruction(ix);
        expect(result.instructions).toHaveLength(0);
    });
});

describe('formatParsedInstruction', () => {
    const MINT_AUTHORITY = Keypair.generate().publicKey;
    const FREEZE_AUTHORITY = Keypair.generate().publicKey;
    const NEW_AUTHORITY = Keypair.generate().publicKey;
    const OWNER = Keypair.generate().publicKey;

    it.each<
        [
            string,
            {
                data: Uint8Array;
                keys: ReturnType<typeof makeAccount>[];
                mintInfo?: MintInfo;
                fields: DecodedField[];
                accountLabels: string[];
            },
        ]
    >([
        [
            'Transfer with decoded amount',
            {
                accountLabels: ['Source', 'Destination', 'Owner/Delegate'],
                data: makeTransferData(42000n),
                fields: [{ label: 'Amount', value: '42000' }],
                keys: [makeAccount(), makeAccount(), makeAccount(false, true)],
            },
        ],
        [
            'Approve with decoded amount',
            {
                accountLabels: ['Source', 'Delegate', 'Owner'],
                data: makeApproveData(500n),
                fields: [{ label: 'Amount', value: '500' }],
                keys: [makeAccount(), makeAccount(), makeAccount(false, true)],
            },
        ],
        [
            'TransferChecked with decimals',
            {
                accountLabels: ['Source', 'Mint', 'Destination', 'Owner/Delegate'],
                data: makeTransferCheckedData(1000000n, 9),
                fields: [
                    { label: 'Decimals', value: '9' },
                    { label: 'Amount', value: '0.001' },
                ],
                keys: [makeAccount(), makeAccount(), makeAccount(), makeAccount(false, true)],
            },
        ],
        [
            'ApproveChecked with decimals',
            {
                accountLabels: ['Source', 'Mint', 'Delegate', 'Owner'],
                data: makeApproveCheckedData(2000000n, 6),
                fields: [
                    { label: 'Decimals', value: '6' },
                    { label: 'Amount', value: '2' },
                ],
                keys: [makeAccount(), makeAccount(), makeAccount(), makeAccount(false, true)],
            },
        ],
        [
            'MintToChecked with decimals',
            {
                accountLabels: ['Mint', 'Destination', 'Mint Authority'],
                data: makeMintToCheckedData(50000000n, 8),
                fields: [
                    { label: 'Decimals', value: '8' },
                    { label: 'Amount', value: '0.5' },
                ],
                keys: [makeAccount(), makeAccount(), makeAccount(false, true)],
            },
        ],
        [
            'BurnChecked with decimals',
            {
                accountLabels: ['Account', 'Mint', 'Owner/Delegate'],
                data: makeBurnCheckedData(1500000000n, 9),
                fields: [
                    { label: 'Decimals', value: '9' },
                    { label: 'Amount', value: '1.5' },
                ],
                keys: [makeAccount(), makeAccount(), makeAccount(false, true)],
            },
        ],
        [
            'CloseAccount',
            {
                accountLabels: ['Account', 'Destination', 'Owner'],
                data: new Uint8Array([TokenInstruction.CloseAccount]),
                fields: [],
                keys: [makeAccount(), makeAccount(), makeAccount(false, true)],
            },
        ],
        [
            'SetAuthority with new authority set to None',
            {
                accountLabels: ['Account', 'Current Authority'],
                data: makeSetAuthorityData(1),
                fields: [
                    { label: 'Authority Type', value: 'FreezeAccount' },
                    { label: 'New Authority', value: '(none)' },
                ],
                keys: [makeAccount(), makeAccount(false, true)],
            },
        ],
        [
            'SetAuthority with new authority set to Some',
            {
                accountLabels: ['Account', 'Current Authority'],
                data: makeSetAuthorityData(0, NEW_AUTHORITY),
                fields: [
                    { label: 'Authority Type', value: 'MintTokens' },
                    { isAddress: true, label: 'New Authority', value: NEW_AUTHORITY.toBase58() },
                ],
                keys: [makeAccount(), makeAccount(false, true)],
            },
        ],
        [
            'InitializeMint with freeze authority',
            {
                accountLabels: ['Mint', 'Rent Sysvar'],
                data: makeInitializeMintData(9, MINT_AUTHORITY, FREEZE_AUTHORITY),
                fields: [
                    { label: 'Decimals', value: '9' },
                    { isAddress: true, label: 'Mint Authority', value: MINT_AUTHORITY.toBase58() },
                    { isAddress: true, label: 'Freeze Authority', value: FREEZE_AUTHORITY.toBase58() },
                ],
                keys: [makeAccount(), makeAccount(false, false)],
            },
        ],
        [
            'InitializeMint without freeze authority',
            {
                accountLabels: ['Mint', 'Rent Sysvar'],
                data: makeInitializeMintData(6, MINT_AUTHORITY),
                fields: [
                    { label: 'Decimals', value: '6' },
                    { isAddress: true, label: 'Mint Authority', value: MINT_AUTHORITY.toBase58() },
                    { label: 'Freeze Authority', value: '(none)' },
                ],
                keys: [makeAccount(), makeAccount(false, false)],
            },
        ],
        [
            'InitializeAccount v1',
            {
                accountLabels: ['Account', 'Mint', 'Owner', 'Rent Sysvar'],
                data: makeInitializeAccountData(),
                fields: [],
                keys: [makeAccount(), makeAccount(false, false), makeAccount(false, true), makeAccount(false, false)],
            },
        ],
        [
            'InitializeAccount2 with owner in data',
            {
                accountLabels: ['Account', 'Mint', 'Rent Sysvar'],
                data: makeInitializeAccount2Data(OWNER),
                fields: [{ isAddress: true, label: 'Owner', value: OWNER.toBase58() }],
                keys: [makeAccount(), makeAccount(false, false), makeAccount(false, false)],
            },
        ],
        [
            'SyncNative',
            {
                accountLabels: ['Account'],
                data: makeSyncNativeData(),
                fields: [],
                keys: [makeAccount()],
            },
        ],
        [
            'WithdrawExcessLamports',
            {
                accountLabels: ['Source', 'Destination', 'Authority'],
                data: makeWithdrawExcessLamportsData(),
                fields: [],
                keys: [makeAccount(), makeAccount(), makeAccount(false, true)],
            },
        ],
        [
            'MintTo without decimals',
            {
                accountLabels: ['Mint', 'Destination', 'Mint Authority'],
                data: makeMintToData(100000n),
                fields: [{ label: 'Amount', value: '100000' }],
                keys: [makeAccount(false, false), makeAccount(), makeAccount(false, true)],
            },
        ],
        [
            'MintTo with external decimals',
            {
                accountLabels: ['Mint', 'Destination', 'Mint Authority'],
                data: makeMintToData(500000n),
                fields: [{ label: 'Amount', value: '0.5' }],
                keys: [makeAccount(false, false), makeAccount(), makeAccount(false, true)],
                mintInfo: { decimals: 6 },
            },
        ],
        [
            'Burn without decimals',
            {
                accountLabels: ['Account', 'Mint', 'Owner/Delegate'],
                data: makeBurnData(500n),
                fields: [{ label: 'Amount', value: '500' }],
                keys: [makeAccount(), makeAccount(false, false), makeAccount(false, true)],
            },
        ],
        [
            'FreezeAccount',
            {
                accountLabels: ['Account', 'Mint', 'Freeze Authority'],
                data: makeFreezeAccountData(),
                fields: [],
                keys: [makeAccount(), makeAccount(false, false), makeAccount(false, true)],
            },
        ],
        [
            'ThawAccount',
            {
                accountLabels: ['Account', 'Mint', 'Freeze Authority'],
                data: makeThawAccountData(),
                fields: [],
                keys: [makeAccount(), makeAccount(false, false), makeAccount(false, true)],
            },
        ],
        [
            'Revoke',
            {
                accountLabels: ['Source', 'Owner'],
                data: makeRevokeData(),
                fields: [],
                keys: [makeAccount(), makeAccount(false, true)],
            },
        ],
        [
            'InitializeMint2 with freeze authority',
            {
                accountLabels: ['Mint'],
                data: makeInitializeMint2Data(9, MINT_AUTHORITY, FREEZE_AUTHORITY),
                fields: [
                    { label: 'Decimals', value: '9' },
                    { isAddress: true, label: 'Mint Authority', value: MINT_AUTHORITY.toBase58() },
                    { isAddress: true, label: 'Freeze Authority', value: FREEZE_AUTHORITY.toBase58() },
                ],
                keys: [makeAccount()],
            },
        ],
        [
            'InitializeMint2 without freeze authority',
            {
                accountLabels: ['Mint'],
                data: makeInitializeMint2Data(6, MINT_AUTHORITY),
                fields: [
                    { label: 'Decimals', value: '6' },
                    { isAddress: true, label: 'Mint Authority', value: MINT_AUTHORITY.toBase58() },
                    { label: 'Freeze Authority', value: '(none)' },
                ],
                keys: [makeAccount()],
            },
        ],
        [
            'InitializeAccount3 with owner in data',
            {
                accountLabels: ['Account', 'Mint'],
                data: makeInitializeAccount3Data(OWNER),
                fields: [{ isAddress: true, label: 'Owner', value: OWNER.toBase58() }],
                keys: [makeAccount(), makeAccount(false, false)],
            },
        ],
    ])('should format %s', (_name, { data, keys, mintInfo, fields, accountLabels }) => {
        const ix = makeBatchIxWithKeys([{ data, numAccounts: keys.length }], keys);
        const { instructions } = parseBatchInstruction(ix);
        const decoded = formatParsedInstruction(instructions[0].parsed, mintInfo);

        expect(decoded?.fields).toEqual(fields);
        expect(decoded?.accounts.map(a => a.label)).toEqual(accountLabels);
    });

    it('should format Transfer with external mintInfo decimals', () => {
        const ix = makeBatchIxWithKeys(
            [{ data: makeTransferData(1500000n), numAccounts: 3 }],
            [makeAccount(), makeAccount(), makeAccount(false, true)],
        );
        const { instructions } = parseBatchInstruction(ix);
        const mint = Keypair.generate().publicKey.toBase58();
        const decoded = formatParsedInstruction(instructions[0].parsed, { decimals: 6, mint });

        expect(decoded).toBeDefined();
        expect(decoded?.fields).toEqual([{ label: 'Amount', value: '1.5' }]);
        expect(decoded?.accounts[1].label).toBe('Mint*');
        expect(decoded?.accounts[1].pubkey.toBase58()).toBe(mint);
    });

    it('should append extra signers from multisig instructions', () => {
        const ix = makeBatchIxWithKeys(
            [{ data: makeTransferData(100n), numAccounts: 5 }],
            [
                makeAccount(true, false), // Source
                makeAccount(true, false), // Destination
                makeAccount(false, false), // Multisig authority
                makeAccount(false, true), // Co-signer 1
                makeAccount(false, true), // Co-signer 2
            ],
        );
        const { instructions } = parseBatchInstruction(ix);
        const decoded = formatParsedInstruction(instructions[0].parsed, undefined, instructions[0].extraSigners);

        expect(decoded).toBeDefined();
        expect(decoded?.accounts.map(a => a.label)).toEqual([
            'Source',
            'Destination',
            'Owner/Delegate',
            'Signer 1',
            'Signer 2',
        ]);
        expect(decoded?.accounts[3].isSigner).toBe(true);
        expect(decoded?.accounts[4].isSigner).toBe(true);
    });
});

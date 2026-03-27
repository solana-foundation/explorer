import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import { Keypair } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { concatBytes, writeU64LE } from '@/app/shared/lib/bytes';

import { isTokenBatchInstruction, parseBatchInstruction } from '../batch-parser';
import { BATCH_DISCRIMINATOR } from '../const';
import { decodeSubInstructionParams } from '../decode-sub-instruction';
import {
    buildBatchData,
    makeAccount,
    makeApproveCheckedData,
    makeApproveData,
    makeBurnCheckedData,
    makeMintToCheckedData,
    makeSetAuthorityData,
    makeTransferCheckedData,
    makeTransferData,
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
        const transferData = makeTransferData(1000n);
        const data = buildBatchData([{ data: transferData, numAccounts: 3 }]);
        const accounts = [makeAccount(), makeAccount(), makeAccount(false, true)];

        const result = parseBatchInstruction(data, accounts);

        expect(result).toHaveLength(1);
        expect(result[0].discriminator).toBe(3);
        expect(result[0].typeName).toBe('Transfer');
        expect(result[0].accounts).toHaveLength(3);
        expect(result[0].index).toBe(0);
    });

    it('should parse multiple sub-instructions', () => {
        const transfer1 = makeTransferData(100n);
        const transfer2 = makeTransferData(200n);
        const transfer3 = makeTransferData(300n);

        const data = buildBatchData([
            { data: transfer1, numAccounts: 3 },
            { data: transfer2, numAccounts: 3 },
            { data: transfer3, numAccounts: 3 },
        ]);

        const accounts = Array.from({ length: 9 }, () => makeAccount());

        const result = parseBatchInstruction(data, accounts);

        expect(result).toHaveLength(3);
        expect(result[0].index).toBe(0);
        expect(result[1].index).toBe(1);
        expect(result[2].index).toBe(2);
    });

    it('should consume accounts sequentially', () => {
        const transfer1 = makeTransferData(100n);
        const transfer2 = makeTransferData(200n);

        const data = buildBatchData([
            { data: transfer1, numAccounts: 3 },
            { data: transfer2, numAccounts: 3 },
        ]);

        const accounts = Array.from({ length: 6 }, () => ({
            isSigner: false,
            isWritable: true,
            pubkey: Keypair.generate().publicKey,
        }));

        const result = parseBatchInstruction(data, accounts);

        expect(result[0].accounts).toEqual(accounts.slice(0, 3));
        expect(result[1].accounts).toEqual(accounts.slice(3, 6));
    });

    it('should handle empty batch', () => {
        const data = new Uint8Array([BATCH_DISCRIMINATOR]);
        const result = parseBatchInstruction(data, []);

        expect(result).toHaveLength(0);
    });

    it('should throw on truncated data (missing data_len)', () => {
        const data = new Uint8Array([BATCH_DISCRIMINATOR, 3]);
        const accounts = Array.from({ length: 3 }, () => makeAccount());

        expect(() => parseBatchInstruction(data, accounts)).toThrow('Truncated data');
    });

    it('should throw on truncated sub-instruction data', () => {
        const data = new Uint8Array([BATCH_DISCRIMINATOR, 3, 9, 3]); // says 9 bytes but only 1 follows
        const accounts = Array.from({ length: 3 }, () => makeAccount());

        expect(() => parseBatchInstruction(data, accounts)).toThrow('Truncated data');
    });

    it('should throw on insufficient accounts', () => {
        const transferData = makeTransferData(100n);
        const data = buildBatchData([{ data: transferData, numAccounts: 3 }]);
        const accounts = [makeAccount()]; // only 1 account, needs 3

        expect(() => parseBatchInstruction(data, accounts)).toThrow('Insufficient accounts');
    });

    it('should throw on non-batch data', () => {
        const data = new Uint8Array([3, 0, 0, 0]);

        expect(() => parseBatchInstruction(data, [])).toThrow('Not a batch instruction');
    });

    it('should identify unknown discriminators', () => {
        const unknownData = new Uint8Array([0xfe, 1, 2, 3]);
        const data = buildBatchData([{ data: unknownData, numAccounts: 1 }]);
        const accounts = [makeAccount()];

        const result = parseBatchInstruction(data, accounts);

        expect(result[0].typeName).toBe('Unknown');
    });

    it('should parse mixed instruction types', () => {
        const transfer = makeTransferData(100n);
        const transferChecked = makeTransferCheckedData(200n, 6);

        const data = buildBatchData([
            { data: transfer, numAccounts: 3 },
            { data: transferChecked, numAccounts: 4 },
        ]);

        const accounts = Array.from({ length: 7 }, () => makeAccount());

        const result = parseBatchInstruction(data, accounts);

        expect(result).toHaveLength(2);
        expect(result[0].typeName).toBe('Transfer');
        expect(result[1].typeName).toBe('TransferChecked');
    });
});

describe('decodeSubInstructionParams', () => {
    // Unchecked amount instructions — raw amount, no decimals in data
    it.each([
        {
            amount: 42000n,
            data: makeTransferData(42000n),
            expected: '42000',
            labels: ['Source', 'Destination', 'Owner/Delegate'],
            numAccounts: 3,
            type: 'Transfer' as const,
        },
        {
            amount: 500n,
            data: makeApproveData(500n),
            expected: '500',
            labels: ['Source', 'Delegate', 'Owner'],
            numAccounts: 3,
            type: 'Approve' as const,
        },
        {
            amount: 5000n,
            data: concatBytes(new Uint8Array([7]), writeU64LE(5000n)),
            expected: '5000',
            labels: ['Mint', 'Destination', 'Mint Authority'],
            numAccounts: 3,
            type: 'MintTo' as const,
        },
        {
            amount: 3000n,
            data: concatBytes(new Uint8Array([8]), writeU64LE(3000n)),
            expected: '3000',
            labels: ['Account', 'Mint', 'Owner/Delegate'],
            numAccounts: 3,
            type: 'Burn' as const,
        },
    ])('should decode $type with amount $expected', ({ type, data, numAccounts, expected, labels }) => {
        const accounts = Array.from({ length: numAccounts }, (_, i) =>
            makeAccount(i < numAccounts - 1, i === numAccounts - 1),
        );
        const decoded = decodeSubInstructionParams(type, data, accounts);

        if (!decoded) throw new Error(`Expected ${type} to decode`);
        expect(decoded.fields).toEqual([{ label: 'Amount', value: expected }]);
        expect(decoded.accounts.map(a => a.label)).toEqual(labels);
    });

    // Checked amount instructions — amount + decimals in data
    it.each([
        {
            data: makeTransferCheckedData(1000000n, 9),
            expectedAmount: '0.001',
            expectedDecimals: '9',
            labels: ['Source', 'Mint', 'Destination', 'Owner/Delegate'],
            numAccounts: 4,
            type: 'TransferChecked' as const,
        },
        {
            data: makeApproveCheckedData(2000000n, 6),
            expectedAmount: '2',
            expectedDecimals: '6',
            labels: ['Source', 'Mint', 'Delegate', 'Owner'],
            numAccounts: 4,
            type: 'ApproveChecked' as const,
        },
        {
            data: makeMintToCheckedData(50000000n, 8),
            expectedAmount: '0.5',
            expectedDecimals: '8',
            labels: ['Mint', 'Destination', 'Mint Authority'],
            numAccounts: 3,
            type: 'MintToChecked' as const,
        },
        {
            data: makeBurnCheckedData(1500000000n, 9),
            expectedAmount: '1.5',
            expectedDecimals: '9',
            labels: ['Account', 'Mint', 'Owner/Delegate'],
            numAccounts: 3,
            type: 'BurnChecked' as const,
        },
    ])(
        'should decode $type with amount $expectedAmount',
        ({ type, data, numAccounts, expectedAmount, expectedDecimals, labels }) => {
            const accounts = Array.from({ length: numAccounts }, (_, i) =>
                makeAccount(i < numAccounts - 1, i === numAccounts - 1),
            );
            const decoded = decodeSubInstructionParams(type, data, accounts);

            if (!decoded) throw new Error(`Expected ${type} to decode`);
            expect(decoded.fields).toEqual([
                { label: 'Decimals', value: expectedDecimals },
                { label: 'Amount', value: expectedAmount },
            ]);
            expect(decoded.accounts.map(a => a.label)).toEqual(labels);
        },
    );

    it('should decode CloseAccount params', () => {
        const data = new Uint8Array([9]);
        const accounts = [makeAccount(), makeAccount(), makeAccount(false, true)];
        const decoded = decodeSubInstructionParams('CloseAccount', data, accounts);

        if (!decoded) throw new Error('Expected CloseAccount to decode');
        expect(decoded.fields).toEqual([]);
        expect(decoded.accounts.map(a => a.label)).toEqual(['Account', 'Destination', 'Owner']);
    });

    it('should include signer labels for multisig', () => {
        const data = makeTransferData(100n);
        const accounts = [
            makeAccount(),
            makeAccount(),
            makeAccount(false, true),
            makeAccount(false, true),
            makeAccount(false, true),
        ];
        const decoded = decodeSubInstructionParams('Transfer', data, accounts);

        if (!decoded) throw new Error('Expected Transfer to decode');
        expect(decoded.accounts.map(a => a.label)).toEqual([
            'Source',
            'Destination',
            'Owner/Delegate',
            'Signer 1',
            'Signer 2',
        ]);
    });

    it('should decode SetAuthority with new authority set to None', () => {
        const data = makeSetAuthorityData(1);
        const accounts = [makeAccount(), makeAccount(false, true)];
        const decoded = decodeSubInstructionParams('SetAuthority', data, accounts);

        if (!decoded) throw new Error('Expected SetAuthority to decode');
        expect(decoded.fields).toEqual([
            { label: 'Authority Type', value: 'FreezeAccount' },
            { label: 'New Authority', value: '(none)' },
        ]);
        expect(decoded.accounts.map(a => a.label)).toEqual(['Account', 'Current Authority']);
    });

    it('should decode SetAuthority with new authority set to Some', () => {
        const newAuth = Keypair.generate().publicKey;
        const data = makeSetAuthorityData(0, newAuth);
        const accounts = [makeAccount(), makeAccount(false, true)];
        const decoded = decodeSubInstructionParams('SetAuthority', data, accounts);

        if (!decoded) throw new Error('Expected SetAuthority to decode');
        expect(decoded.fields).toEqual([
            { label: 'Authority Type', value: 'MintTokens' },
            { label: 'New Authority', value: newAuth.toBase58() },
        ]);
    });

    // Truncated / malformed data — all return undefined
    it.each([
        { data: new Uint8Array([0xfe, 1, 2, 3]), label: 'unknown discriminator', type: 'Unknown' as const },
        { data: new Uint8Array([3, 0, 0, 0]), label: 'truncated Transfer', type: 'Transfer' as const },
        {
            data: concatBytes(new Uint8Array([12]), writeU64LE(100n)),
            label: 'truncated TransferChecked',
            type: 'TransferChecked' as const,
        },
        { data: new Uint8Array([6]), label: 'truncated SetAuthority', type: 'SetAuthority' as const },
        {
            data: new Uint8Array([6, 0, 1]),
            label: 'SetAuthority with Some but missing pubkey',
            type: 'SetAuthority' as const,
        },
        { data: new Uint8Array([]), label: 'empty CloseAccount', type: 'CloseAccount' as const },
    ])('should return undefined for $label', ({ type, data }) => {
        expect(decodeSubInstructionParams(type, data, [makeAccount(), makeAccount(false, true)])).toBeUndefined();
    });

    // External mintInfo — formats unchecked amount with provided decimals
    it.each([
        { amount: 1500000n, data: makeTransferData(1500000n), decimals: 6, expected: '1.5', type: 'Transfer' as const },
        {
            amount: 25000000n,
            data: makeApproveData(25000000n),
            decimals: 8,
            expected: '0.25',
            type: 'Approve' as const,
        },
    ])(
        'should format $type amount as $expected when mintInfo provides $decimals decimals',
        ({ type, data, decimals, expected }) => {
            const accounts = [makeAccount(), makeAccount(), makeAccount(false, true)];
            const mint = Keypair.generate().publicKey.toBase58();
            const decoded = decodeSubInstructionParams(type, data, accounts, { decimals, mint });

            if (!decoded) throw new Error(`Expected ${type} to decode`);
            expect(decoded.fields).toEqual([{ label: 'Amount', value: expected }]);
            expect(decoded.accounts[1].label).toBe('Mint');
            expect(decoded.accounts[1].pubkey.toBase58()).toBe(mint);
        },
    );
});

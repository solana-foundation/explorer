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
    it('should detect batch instruction for Token Program', () => {
        const ix = {
            data: new Uint8Array([0xff, 3, 9, 3, 0, 0, 0, 0, 0, 0, 0, 1]),
            keys: [],
            programId: TOKEN_PROGRAM_ID,
        };
        expect(isTokenBatchInstruction(ix)).toBe(true);
    });

    it('should detect batch instruction for Token-2022 Program', () => {
        const ix = {
            data: new Uint8Array([0xff]),
            keys: [],
            programId: TOKEN_2022_PROGRAM_ID,
        };
        expect(isTokenBatchInstruction(ix)).toBe(true);
    });

    it('should reject non-batch instruction', () => {
        const ix = {
            data: new Uint8Array([3, 0, 0, 0, 0, 0, 0, 0, 1]),
            keys: [],
            programId: TOKEN_PROGRAM_ID,
        };
        expect(isTokenBatchInstruction(ix)).toBe(false);
    });

    it('should reject non-token program', () => {
        const ix = {
            data: new Uint8Array([0xff]),
            keys: [],
            programId: Keypair.generate().publicKey,
        };
        expect(isTokenBatchInstruction(ix)).toBe(false);
    });

    it('should reject empty data', () => {
        const ix = {
            data: new Uint8Array(0),
            keys: [],
            programId: TOKEN_PROGRAM_ID,
        };
        expect(isTokenBatchInstruction(ix)).toBe(false);
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
    it('should decode Transfer params', () => {
        const data = makeTransferData(42000n);
        const accounts = [makeAccount(), makeAccount(), makeAccount(false, true)];

        const decoded = decodeSubInstructionParams('Transfer', data, accounts);

        if (!decoded) throw new Error('Expected decoded to be defined');
        expect(decoded.fields).toEqual([{ label: 'Amount', value: '42000' }]);
        expect(decoded.accounts.map(a => a.label)).toEqual(['Source', 'Destination', 'Owner/Delegate']);
    });

    it('should decode TransferChecked params', () => {
        const data = makeTransferCheckedData(1000000n, 9);
        const accounts = [makeAccount(), makeAccount(), makeAccount(), makeAccount(false, true)];

        const decoded = decodeSubInstructionParams('TransferChecked', data, accounts);

        if (!decoded) throw new Error('Expected decoded to be defined');
        expect(decoded.fields).toEqual([
            { label: 'Amount', value: '0.001' },
            { label: 'Decimals', value: '9' },
        ]);
        expect(decoded.accounts.map(a => a.label)).toEqual(['Source', 'Mint', 'Destination', 'Owner/Delegate']);
    });

    it('should decode CloseAccount params', () => {
        const data = new Uint8Array([9]);
        const accounts = [makeAccount(), makeAccount(), makeAccount(false, true)];

        const decoded = decodeSubInstructionParams('CloseAccount', data, accounts);

        if (!decoded) throw new Error('Expected decoded to be defined');
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

        if (!decoded) throw new Error('Expected decoded to be defined');
        expect(decoded.accounts.map(a => a.label)).toEqual([
            'Source',
            'Destination',
            'Owner/Delegate',
            'Signer 1',
            'Signer 2',
        ]);
    });

    it('should return undefined for unknown discriminators', () => {
        const data = new Uint8Array([0xfe, 1, 2, 3]);
        const decoded = decodeSubInstructionParams('Unknown', data, []);

        expect(decoded).toBeUndefined();
    });

    it('should decode MintTo params', () => {
        const data = concatBytes(new Uint8Array([7]), writeU64LE(5000n));
        const accounts = [makeAccount(), makeAccount(), makeAccount(false, true)];

        const decoded = decodeSubInstructionParams('MintTo', data, accounts);

        if (!decoded) throw new Error('Expected decoded to be defined');
        expect(decoded.fields).toEqual([{ label: 'Amount', value: '5000' }]);
        expect(decoded.accounts.map(a => a.label)).toEqual(['Mint', 'Destination', 'Mint Authority']);
    });

    it('should decode Burn params', () => {
        const data = concatBytes(new Uint8Array([8]), writeU64LE(3000n));
        const accounts = [makeAccount(), makeAccount(), makeAccount(false, true)];

        const decoded = decodeSubInstructionParams('Burn', data, accounts);

        if (!decoded) throw new Error('Expected decoded to be defined');
        expect(decoded.fields).toEqual([{ label: 'Amount', value: '3000' }]);
        expect(decoded.accounts.map(a => a.label)).toEqual(['Account', 'Mint', 'Owner/Delegate']);
    });

    it('should return undefined for truncated Transfer data', () => {
        // Transfer needs 9 bytes (1 discriminator + 8 amount), only 4 provided
        const data = new Uint8Array([3, 0, 0, 0]);
        expect(decodeSubInstructionParams('Transfer', data, [])).toBeUndefined();
    });

    it('should return undefined for truncated TransferChecked data', () => {
        // TransferChecked needs 10 bytes (1 + 8 + 1), only 9 provided
        const data = concatBytes(new Uint8Array([12]), writeU64LE(100n));
        expect(decodeSubInstructionParams('TransferChecked', data, [])).toBeUndefined();
    });

    it('should return undefined for truncated SetAuthority data', () => {
        // SetAuthority needs at least 3 bytes (1 + 1 + 1), only discriminator provided
        const data = new Uint8Array([6]);
        expect(decodeSubInstructionParams('SetAuthority', data, [])).toBeUndefined();
    });

    it('should return undefined for SetAuthority with Some tag but missing pubkey', () => {
        // 3 bytes: discriminator(6) + authority_type(0) + option_tag(1=Some), but no pubkey follows.
        // The SDK decoder throws on truncated data, so we fall back to undefined.
        const data = new Uint8Array([6, 0, 1]);
        expect(
            decodeSubInstructionParams('SetAuthority', data, [makeAccount(), makeAccount(false, true)]),
        ).toBeUndefined();
    });

    it('should return undefined for empty CloseAccount data', () => {
        const data = new Uint8Array([]);
        expect(decodeSubInstructionParams('CloseAccount', data, [])).toBeUndefined();
    });

    it('should decode Approve params', () => {
        const data = makeApproveData(500n);
        const accounts = [makeAccount(), makeAccount(), makeAccount(false, true)];

        const decoded = decodeSubInstructionParams('Approve', data, accounts);

        if (!decoded) throw new Error('Expected decoded to be defined');
        expect(decoded.fields).toEqual([{ label: 'Amount', value: '500' }]);
        expect(decoded.accounts.map(a => a.label)).toEqual(['Source', 'Delegate', 'Owner']);
    });

    it('should decode ApproveChecked params', () => {
        const data = makeApproveCheckedData(2000000n, 6);
        const accounts = [makeAccount(), makeAccount(), makeAccount(), makeAccount(false, true)];

        const decoded = decodeSubInstructionParams('ApproveChecked', data, accounts);

        if (!decoded) throw new Error('Expected decoded to be defined');
        expect(decoded.fields).toEqual([
            { label: 'Amount', value: '2' },
            { label: 'Decimals', value: '6' },
        ]);
        expect(decoded.accounts.map(a => a.label)).toEqual(['Source', 'Mint', 'Delegate', 'Owner']);
    });

    it('should decode MintToChecked params', () => {
        const data = makeMintToCheckedData(50000000n, 8);
        const accounts = [makeAccount(), makeAccount(), makeAccount(false, true)];

        const decoded = decodeSubInstructionParams('MintToChecked', data, accounts);

        if (!decoded) throw new Error('Expected decoded to be defined');
        expect(decoded.fields).toEqual([
            { label: 'Amount', value: '0.5' },
            { label: 'Decimals', value: '8' },
        ]);
        expect(decoded.accounts.map(a => a.label)).toEqual(['Mint', 'Destination', 'Mint Authority']);
    });

    it('should decode BurnChecked params', () => {
        const data = makeBurnCheckedData(1500000000n, 9);
        const accounts = [makeAccount(), makeAccount(), makeAccount(false, true)];

        const decoded = decodeSubInstructionParams('BurnChecked', data, accounts);

        if (!decoded) throw new Error('Expected decoded to be defined');
        expect(decoded.fields).toEqual([
            { label: 'Amount', value: '1.5' },
            { label: 'Decimals', value: '9' },
        ]);
        expect(decoded.accounts.map(a => a.label)).toEqual(['Account', 'Mint', 'Owner/Delegate']);
    });

    it('should decode SetAuthority with new authority set to None', () => {
        const data = makeSetAuthorityData(1);
        const accounts = [makeAccount(), makeAccount(false, true)];

        const decoded = decodeSubInstructionParams('SetAuthority', data, accounts);

        if (!decoded) throw new Error('Expected decoded to be defined');
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

        if (!decoded) throw new Error('Expected decoded to be defined');
        expect(decoded.fields).toEqual([
            { label: 'Authority Type', value: 'MintTokens' },
            { label: 'New Authority', value: newAuth.toBase58() },
        ]);
    });

    it('should format Transfer amount with decimals when provided', () => {
        const data = makeTransferData(1500000n);
        const accounts = [makeAccount(), makeAccount(), makeAccount(false, true)];
        const mint = Keypair.generate().publicKey.toBase58();

        const decoded = decodeSubInstructionParams('Transfer', data, accounts, { decimals: 6, mint });

        if (!decoded) throw new Error('Expected decoded to be defined');
        expect(decoded.fields).toEqual([{ label: 'Amount', value: '1.5' }]);
        expect(decoded.accounts[1].label).toBe('Mint');
        expect(decoded.accounts[1].pubkey.toBase58()).toBe(mint);
    });

    it('should format Approve amount with decimals when provided', () => {
        const data = makeApproveData(25000000n);
        const accounts = [makeAccount(), makeAccount(), makeAccount(false, true)];
        const mint = Keypair.generate().publicKey.toBase58();

        const decoded = decodeSubInstructionParams('Approve', data, accounts, { decimals: 8, mint });

        if (!decoded) throw new Error('Expected decoded to be defined');
        expect(decoded.fields).toEqual([{ label: 'Amount', value: '0.25' }]);
        expect(decoded.accounts[1].label).toBe('Mint');
        expect(decoded.accounts[1].pubkey.toBase58()).toBe(mint);
    });
});

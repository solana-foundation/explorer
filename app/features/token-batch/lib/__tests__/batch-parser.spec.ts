import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import { Keypair, TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from '@solana-program/token';
import { describe, expect, it } from 'vitest';

import { toBuffer } from '@/app/shared/lib/bytes';

import { isTokenBatchInstruction, parseBatchInstruction } from '../batch-parser';
import { BATCH_DISCRIMINATOR } from '../const';
import { formatParsedInstruction } from '../format-sub-instruction';
import {
    makeAccount,
    makeApproveCheckedData,
    makeApproveData,
    makeBatchIx,
    makeBatchIxWithKeys,
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
    it('should format Transfer with decoded amount', () => {
        const ix = makeBatchIxWithKeys(
            [{ data: makeTransferData(42000n), numAccounts: 3 }],
            [makeAccount(), makeAccount(), makeAccount(false, true)],
        );
        const { instructions } = parseBatchInstruction(ix);
        const decoded = formatParsedInstruction(instructions[0].parsed);

        expect(decoded).toBeDefined();
        expect(decoded?.fields).toEqual([{ label: 'Amount', value: '42000' }]);
        expect(decoded?.accounts.map(a => a.label)).toEqual(['Source', 'Destination', 'Owner/Delegate']);
    });

    it('should format Approve with decoded amount', () => {
        const ix = makeBatchIxWithKeys(
            [{ data: makeApproveData(500n), numAccounts: 3 }],
            [makeAccount(), makeAccount(), makeAccount(false, true)],
        );
        const { instructions } = parseBatchInstruction(ix);
        const decoded = formatParsedInstruction(instructions[0].parsed);

        expect(decoded).toBeDefined();
        expect(decoded?.fields).toEqual([{ label: 'Amount', value: '500' }]);
        expect(decoded?.accounts.map(a => a.label)).toEqual(['Source', 'Delegate', 'Owner']);
    });

    it('should format TransferChecked with decimals', () => {
        const ix = makeBatchIxWithKeys(
            [{ data: makeTransferCheckedData(1000000n, 9), numAccounts: 4 }],
            [makeAccount(), makeAccount(), makeAccount(), makeAccount(false, true)],
        );
        const { instructions } = parseBatchInstruction(ix);
        const decoded = formatParsedInstruction(instructions[0].parsed);

        expect(decoded).toBeDefined();
        expect(decoded?.fields).toEqual([
            { label: 'Decimals', value: '9' },
            { label: 'Amount', value: '0.001' },
        ]);
        expect(decoded?.accounts.map(a => a.label)).toEqual(['Source', 'Mint', 'Destination', 'Owner/Delegate']);
    });

    it('should format ApproveChecked with decimals', () => {
        const ix = makeBatchIxWithKeys(
            [{ data: makeApproveCheckedData(2000000n, 6), numAccounts: 4 }],
            [makeAccount(), makeAccount(), makeAccount(), makeAccount(false, true)],
        );
        const { instructions } = parseBatchInstruction(ix);
        const decoded = formatParsedInstruction(instructions[0].parsed);

        expect(decoded).toBeDefined();
        expect(decoded?.fields).toEqual([
            { label: 'Decimals', value: '6' },
            { label: 'Amount', value: '2' },
        ]);
        expect(decoded?.accounts.map(a => a.label)).toEqual(['Source', 'Mint', 'Delegate', 'Owner']);
    });

    it('should format MintToChecked with decimals', () => {
        const ix = makeBatchIxWithKeys(
            [{ data: makeMintToCheckedData(50000000n, 8), numAccounts: 3 }],
            [makeAccount(), makeAccount(), makeAccount(false, true)],
        );
        const { instructions } = parseBatchInstruction(ix);
        const decoded = formatParsedInstruction(instructions[0].parsed);

        expect(decoded).toBeDefined();
        expect(decoded?.fields).toEqual([
            { label: 'Decimals', value: '8' },
            { label: 'Amount', value: '0.5' },
        ]);
        expect(decoded?.accounts.map(a => a.label)).toEqual(['Mint', 'Destination', 'Mint Authority']);
    });

    it('should format BurnChecked with decimals', () => {
        const ix = makeBatchIxWithKeys(
            [{ data: makeBurnCheckedData(1500000000n, 9), numAccounts: 3 }],
            [makeAccount(), makeAccount(), makeAccount(false, true)],
        );
        const { instructions } = parseBatchInstruction(ix);
        const decoded = formatParsedInstruction(instructions[0].parsed);

        expect(decoded).toBeDefined();
        expect(decoded?.fields).toEqual([
            { label: 'Decimals', value: '9' },
            { label: 'Amount', value: '1.5' },
        ]);
        expect(decoded?.accounts.map(a => a.label)).toEqual(['Account', 'Mint', 'Owner/Delegate']);
    });

    it('should format CloseAccount', () => {
        const data = new Uint8Array([9]); // CloseAccount discriminator
        const ix = makeBatchIxWithKeys(
            [{ data, numAccounts: 3 }],
            [makeAccount(), makeAccount(), makeAccount(false, true)],
        );
        const { instructions } = parseBatchInstruction(ix);
        const decoded = formatParsedInstruction(instructions[0].parsed);

        expect(decoded).toBeDefined();
        expect(decoded?.fields).toEqual([]);
        expect(decoded?.accounts.map(a => a.label)).toEqual(['Account', 'Destination', 'Owner']);
    });

    it('should format SetAuthority with new authority set to None', () => {
        const ix = makeBatchIxWithKeys(
            [{ data: makeSetAuthorityData(1), numAccounts: 2 }],
            [makeAccount(), makeAccount(false, true)],
        );
        const { instructions } = parseBatchInstruction(ix);
        const decoded = formatParsedInstruction(instructions[0].parsed);

        expect(decoded).toBeDefined();
        expect(decoded?.fields).toEqual([
            { label: 'Authority Type', value: 'FreezeAccount' },
            { label: 'New Authority', value: '(none)' },
        ]);
        expect(decoded?.accounts.map(a => a.label)).toEqual(['Account', 'Current Authority']);
    });

    it('should format SetAuthority with new authority set to Some', () => {
        const newAuth = Keypair.generate().publicKey;
        const ix = makeBatchIxWithKeys(
            [{ data: makeSetAuthorityData(0, newAuth), numAccounts: 2 }],
            [makeAccount(), makeAccount(false, true)],
        );
        const { instructions } = parseBatchInstruction(ix);
        const decoded = formatParsedInstruction(instructions[0].parsed);

        expect(decoded).toBeDefined();
        expect(decoded?.fields).toEqual([
            { label: 'Authority Type', value: 'MintTokens' },
            { isAddress: true, label: 'New Authority', value: newAuth.toBase58() },
        ]);
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

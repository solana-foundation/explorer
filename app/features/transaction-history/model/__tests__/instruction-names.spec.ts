import type { ParsedTransactionWithMeta } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@utils/programs', async importOriginal => {
    const original = await importOriginal<typeof import('@utils/programs')>();
    return {
        ...original,
        getProgramName: vi.fn(() => 'TestProgram'),
    };
});

import { getTransactionInstructionNames } from '@utils/instruction';

function makeTransaction(instructions: unknown[]): ParsedTransactionWithMeta {
    return {
        transaction: {
            message: {
                instructions,
            },
        },
    } as unknown as ParsedTransactionWithMeta;
}

describe('getTransactionInstructionNames', () => {
    it('returns instruction name for parsed instruction with type', () => {
        const tx = makeTransaction([{ parsed: { type: 'transfer' }, programId: PublicKey.default }]);
        expect(getTransactionInstructionNames(tx)).toEqual(['TestProgram: Transfer']);
    });

    it('converts camelCase type to title case', () => {
        const tx = makeTransaction([{ parsed: { type: 'transferChecked' }, programId: PublicKey.default }]);
        expect(getTransactionInstructionNames(tx)).toEqual(['TestProgram: Transfer Checked']);
    });

    it('returns Memo label for parsed instruction with string value', () => {
        const tx = makeTransaction([{ parsed: 'some memo text', programId: PublicKey.default }]);
        expect(getTransactionInstructionNames(tx)).toEqual(['TestProgram: Memo']);
    });

    it('returns Unknown Instruction for unrecognized partially decoded instruction', () => {
        // System program (default pubkey) is not ComputeBudget, so falls through to Unknown Instruction
        const tx = makeTransaction([{ accounts: [], data: 'data', programId: PublicKey.default }]);
        expect(getTransactionInstructionNames(tx)).toEqual(['TestProgram Program: Unknown Instruction']);
    });

    it('handles multiple instructions', () => {
        const tx = makeTransaction([
            { parsed: { type: 'transfer' }, programId: PublicKey.default },
            { parsed: 'memo text', programId: PublicKey.default },
        ]);
        expect(getTransactionInstructionNames(tx)).toEqual(['TestProgram: Transfer', 'TestProgram: Memo']);
    });

    it('returns empty array for transaction with no instructions', () => {
        const tx = makeTransaction([]);
        expect(getTransactionInstructionNames(tx)).toEqual([]);
    });
});

import { describe, expect, it } from 'vitest';

import type { ResolvedAccount, TransactionInstructionEntry, TransactionPayloadContext } from '../types.js';
import { buildTransactionPayload } from '../build-payload.js';

function staticAccount(address: string, roles: { signer?: boolean; writable?: boolean } = {}): ResolvedAccount {
    return { address, signer: roles.signer ?? false, source: 'static', writable: roles.writable ?? false };
}

const INSTRUCTION_ENTRIES: TransactionInstructionEntry[] = [
    {
        accounts: ['fee-payer', 'writable-nonsigner'],
        data: 'abc',
        inner_instructions: [{ accounts: ['fee-payer'], data: 'def', program_id: 'program', source: 'raw' }],
        program_id: 'program',
        source: 'raw',
    },
];

function makeContext(overrides: Partial<TransactionPayloadContext> = {}): TransactionPayloadContext {
    const accounts = [
        staticAccount('fee-payer', { signer: true, writable: true }),
        staticAccount('readonly-signer', { signer: true }),
        staticAccount('writable-nonsigner', { writable: true }),
        staticAccount('program'),
    ];
    return {
        accountKeys: accounts.map(account => account.address),
        blockTime: 456,
        computeUnitsConsumed: 12345,
        confirmationStatus: 'finalized',
        confirmations: 'max',
        err: null,
        feeLamports: 5000,
        innerInstructions: null,
        instructions: [{ accounts: [0, 2], data: 'abc', programIdIndex: 3 }],
        logMessages: ['Program log'],
        numReadonlySignedAccounts: 1,
        numReadonlyUnsignedAccounts: 1,
        numRequiredSignatures: 2,
        recentBlockhash: 'GHtXQBbU',
        resolvedAccounts: accounts,
        signature: 'sig',
        slot: 123,
        status: 'success',
        version: 0,
        ...overrides,
    } as TransactionPayloadContext;
}

describe('transaction payload builder', () => {
    it('should build the payload with signer slicing', () => {
        const result = buildTransactionPayload(makeContext(), INSTRUCTION_ENTRIES);

        expect(result.entity).toMatchObject({
            block_time: 456,
            fee_lamports: 5000,
            kind: 'transaction',
            signature: 'sig',
            signers: ['fee-payer', 'readonly-signer'],
            slot: 123,
            status: 'success',
        });
    });

    it('should handle negative signer counts safely', () => {
        const result = buildTransactionPayload(
            makeContext({
                accountKeys: ['a'],
                numReadonlySignedAccounts: 0,
                numReadonlyUnsignedAccounts: 0,
                numRequiredSignatures: -1,
                resolvedAccounts: [staticAccount('a', { writable: true })],
            }),
            [],
        );

        expect(result.entity).toMatchObject({ signers: [] });
    });

    it('should expose resolvedAccounts as the output accounts', () => {
        const result = buildTransactionPayload(makeContext(), INSTRUCTION_ENTRIES);

        expect(result.entity.accounts).toEqual([
            staticAccount('fee-payer', { signer: true, writable: true }),
            staticAccount('readonly-signer', { signer: true }),
            staticAccount('writable-nonsigner', { writable: true }),
            staticAccount('program'),
        ]);
    });

    it('should carry the provided instruction entries verbatim', () => {
        const result = buildTransactionPayload(makeContext(), INSTRUCTION_ENTRIES);

        expect(result.entity.instructions).toBe(INSTRUCTION_ENTRIES);
    });

    it('should include lookup-table attribution flowing through resolvedAccounts', () => {
        const accounts: ResolvedAccount[] = [
            staticAccount('signer', { signer: true, writable: true }),
            staticAccount('program'),
            { address: 'alt-w1', lookupTableAddress: 'ALT-A', signer: false, source: 'lookupTable', writable: true },
            { address: 'alt-r1', lookupTableAddress: 'ALT-A', signer: false, source: 'lookupTable', writable: false },
        ];
        const result = buildTransactionPayload(
            makeContext({
                accountKeys: accounts.map(account => account.address),
                numReadonlySignedAccounts: 0,
                numRequiredSignatures: 1,
                resolvedAccounts: accounts,
            }),
            [],
        );

        expect(result.entity.accounts[2]).toEqual({
            address: 'alt-w1',
            lookupTableAddress: 'ALT-A',
            signer: false,
            source: 'lookupTable',
            writable: true,
        });
    });

    it('should include the scalar transaction fields', () => {
        const result = buildTransactionPayload(makeContext(), INSTRUCTION_ENTRIES);

        expect(result.entity).toMatchObject({
            compute_units_consumed: 12345,
            confirmation_status: 'finalized',
            confirmations: 'max',
            log_messages: ['Program log'],
            recent_blockhash: 'GHtXQBbU',
            transaction_version: 0,
        });
    });

    it('should include the error only when the status is failed', () => {
        const errDetail = { InstructionError: [0, 'Custom'] };

        const failed = buildTransactionPayload(makeContext({ err: errDetail, status: 'failed' }), []);
        expect(failed.entity.error).toEqual(errDetail);
        expect(failed.entity.status).toBe('failed');

        const success = buildTransactionPayload(makeContext(), INSTRUCTION_ENTRIES);
        expect(success.entity.error).toBeNull();
    });

    it('should return a null error for unknown status', () => {
        const result = buildTransactionPayload(makeContext({ err: null, status: 'unknown' }), []);

        expect(result.entity.status).toBe('unknown');
        expect(result.entity.error).toBeNull();
    });

    it('should pass string SafeNumeric values through unchanged', () => {
        const result = buildTransactionPayload(
            makeContext({
                blockTime: '9007199254740994',
                computeUnitsConsumed: '9007199254740993',
                feeLamports: '9007199254740992',
            }),
            [],
        );

        expect(result.entity.fee_lamports).toBe('9007199254740992');
        expect(result.entity.compute_units_consumed).toBe('9007199254740993');
        expect(result.entity.block_time).toBe('9007199254740994');
    });
});

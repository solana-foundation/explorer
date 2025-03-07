import { ComputeBudgetProgram, MessageCompiledInstruction, PublicKey } from '@solana/web3.js';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';

import {
    fillAddressTableLookupsAccounts,
    findLookupAddress,
    intoTransactionInstructionFromVersionedMessage,
} from '../utils';

/**
 * These tests cover examples from the devnet
 */
describe('intoTransactionInstructionFromVersionedMessage', () => {
    test('should return ComputeBudget TransactionInstruction', async () => {
        const compiledInstruction: MessageCompiledInstruction = {
            accountKeyIndexes: [],
            data: new Uint8Array([3, 100, 173, 109, 0, 0, 0, 0, 0]),
            programIdIndex: 6, // index taken from data at stubs.computeBudgetMsg
        };

        const ti = intoTransactionInstructionFromVersionedMessage(
            compiledInstruction,
            mock.deserializeMessageV0(stubs.computeBudgetMsg)
        );
        expect(ti.programId.equals(ComputeBudgetProgram.programId)).toBeTruthy();
        expect(ti.keys).toEqual([]);
        expect(ti.data).toEqual(Buffer.from(compiledInstruction.data));
    });
});

describe('fillAddressTableLookupsAccounts', () => {
    test('should return flatten addressTableLookups from message', () => {
        const message = mock.deserializeMessageV0(stubs.computeBudgetMsg);

        expect(fillAddressTableLookupsAccounts(message.addressTableLookups)).toHaveLength(10);
    });
});

describe('findLookupAddress', () => {
    test('should return lookup data for a specific index', () => {
        const message = mock.deserializeMessageV0(stubs.computeBudgetMsg);

        // pick each different variant of index in addressTableLookups
        const lookups = fillAddressTableLookupsAccounts(message.addressTableLookups);
        let lookup = findLookupAddress(0, message, lookups);
        expect(lookup.lookup.equals(new PublicKey('kFVZ5bdn3c9tMoY4ibqsLDNd6vxt3HwHVcZC5b6ra1y'))).toBeTruthy();
        expect(lookup.dynamicLookups).toStrictEqual({ isStatic: true, lookups: undefined });

        lookup = findLookupAddress(12, message, lookups);
        expect(lookup.lookup.equals(new PublicKey('GDLpHg53y5sufRSftvZscFMwdSqP8kHaLwhsT4ZwYSaV'))).toBeTruthy();
        expect(lookup.dynamicLookups).toStrictEqual({
            isStatic: false,
            lookups: {
                lookupTableIndex: 31,
                lookupTableKey: new PublicKey('GDLpHg53y5sufRSftvZscFMwdSqP8kHaLwhsT4ZwYSaV'),
            },
        });
    });
});

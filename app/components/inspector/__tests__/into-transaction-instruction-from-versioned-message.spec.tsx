import { ComputeBudgetProgram, MessageCompiledInstruction } from '@solana/web3.js';

import {
    fillAddressTableLookupsAccounts,
    findLookupAddress,
    intoTransactionInstructionFromVersionedMessage,
} from '../utils';
import * as mock from './mocks';

/**
 * These tests cover examples from the devnet
 */
describe('intoTransactionInstructionFromVersionedMessage', () => {
    test('should return ComputeBudget TransactionInstruction', async () => {
        const compiledInstruction: MessageCompiledInstruction = {
            accountKeyIndexes: [],
            data: new Uint8Array([3, 100, 173, 109, 0, 0, 0, 0, 0]),
            programIdIndex: 6, // index taken from data at mock.message1
        };

        const ti = intoTransactionInstructionFromVersionedMessage(
            compiledInstruction,
            mock.deserialize(mock.message1),
            ComputeBudgetProgram.programId
        );
        expect(ti.programId).toBe(ComputeBudgetProgram.programId);
        expect(ti.keys).toEqual([]);
        expect(ti.data).toEqual(Buffer.from(compiledInstruction.data));
    });
});

describe('fillAddressTableLookupsAccounts', () => {
    test('should return flatten addressTableLookups from message', () => {
        const message = mock.deserialize(mock.message1);

        expect(fillAddressTableLookupsAccounts(message.addressTableLookups)).toHaveLength(10);
    });
});

describe('findLookupAddress', () => {
    test('should return lookup data for a specific index', () => {
        const message = mock.deserialize(mock.message1);

        // pick each different variant of index in addressTableLookups
        const lookups = fillAddressTableLookupsAccounts(message.addressTableLookups);
        let lookup = findLookupAddress(0, message, lookups);
        expect(lookup.lookup).toEqual('kFVZ5bdn3c9tMoY4ibqsLDNd6vxt3HwHVcZC5b6ra1y');
        expect(lookup.dynamicLookups).toStrictEqual({ isStatic: true, lookups: undefined });

        lookup = findLookupAddress(12, message, lookups);
        expect(lookup.lookup).toEqual('GDLpHg53y5sufRSftvZscFMwdSqP8kHaLwhsT4ZwYSaV');
        expect(lookup.dynamicLookups).toStrictEqual({
            isStatic: false,
            lookups: { lookupTableIndex: 31, lookupTableKey: 'GDLpHg53y5sufRSftvZscFMwdSqP8kHaLwhsT4ZwYSaV' },
        });
    });
});

import { MessageV0, PublicKey } from '@solana/web3.js';
import { describe, expect, test } from 'vitest';

import { intoTransactionInstructionFromVersionedMessage } from '../utils';

const key = (n: number) => new PublicKey(new Uint8Array(32).fill(n));

const STATIC_KEYS = [key(1), key(2)];

function messageWithLookups(
    programIdIndex: number,
    addressTableLookups: { accountKey: PublicKey; readonlyIndexes: number[]; writableIndexes: number[] }[],
) {
    return new MessageV0({
        addressTableLookups,
        compiledInstructions: [{ accountKeyIndexes: [0], data: new Uint8Array([1]), programIdIndex }],
        header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 0, numRequiredSignatures: 1 },
        recentBlockhash: key(5).toBase58(),
        staticAccountKeys: STATIC_KEYS,
    });
}

describe('intoTransactionInstructionFromVersionedMessage', () => {
    test('should resolve a static program id', () => {
        const message = messageWithLookups(1, []);
        const instruction = intoTransactionInstructionFromVersionedMessage(message.compiledInstructions[0], message);
        expect(instruction.programId.equals(STATIC_KEYS[1])).toBe(true);
    });

    test('should resolve a program id from a table that contributes several accounts', () => {
        // Account key indexes past the static keys address the flattened
        // writable-then-readonly lookup accounts, not the tables. One table with
        // two writable indexes yields two accounts, so index 3 is the second of
        // them even though there is only one table.
        const table = key(9);
        const message = messageWithLookups(3, [{ accountKey: table, readonlyIndexes: [], writableIndexes: [7, 8] }]);
        const instruction = intoTransactionInstructionFromVersionedMessage(message.compiledInstructions[0], message);
        expect(instruction.programId.equals(table)).toBe(true);
    });

    test('should resolve a program id to the table that actually owns the account', () => {
        // First table supplies two writable accounts (indexes 2 and 3), so index
        // 4 belongs to the second table. Indexing the tables array would return
        // the second table for index 3 and run off the end at index 4.
        const first = key(9);
        const second = key(10);
        const lookups = [
            { accountKey: first, readonlyIndexes: [], writableIndexes: [7, 8] },
            { accountKey: second, readonlyIndexes: [], writableIndexes: [4] },
        ];
        expect(
            intoTransactionInstructionFromVersionedMessage(
                messageWithLookups(3, lookups).compiledInstructions[0],
                messageWithLookups(3, lookups),
            ).programId.equals(first),
        ).toBe(true);
        expect(
            intoTransactionInstructionFromVersionedMessage(
                messageWithLookups(4, lookups).compiledInstructions[0],
                messageWithLookups(4, lookups),
            ).programId.equals(second),
        ).toBe(true);
    });
});

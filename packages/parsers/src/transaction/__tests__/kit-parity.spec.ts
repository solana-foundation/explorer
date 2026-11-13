import {
    type AccountLookupMeta,
    type AccountMeta,
    blockhash,
    type CompiledTransactionMessageWithLifetime,
    decompileTransactionMessage,
    isSignerRole,
    isWritableRole,
    type LegacyCompiledTransactionMessage,
    type V0CompiledTransactionMessage,
} from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { gen } from '../../__tests__/gen.js';
import { fromCompiledMessage } from '../parse.js';
import type { TransactionAccount } from '../types.js';

const LIFETIME_TOKEN = blockhash(gen.blockhash(7));

describe('fromCompiledMessage', () => {
    it('should resolve legacy static accounts exactly as kit decompiles them', () => {
        const staticAccounts = [gen.address(1), gen.address(2), gen.address(3), gen.address(4)];
        const compiled: CompiledTransactionMessageWithLifetime & LegacyCompiledTransactionMessage = {
            header: { numReadonlyNonSignerAccounts: 1, numReadonlySignerAccounts: 1, numSignerAccounts: 2 },
            instructions: [{ accountIndices: [0, 1, 2, 3], programAddressIndex: 3 }],
            lifetimeToken: LIFETIME_TOKEN,
            staticAccounts,
            version: 'legacy',
        };

        const kitAccounts = firstInstructionAccounts(decompileTransactionMessage(compiled));
        const transaction = fromCompiledMessage(compiled);

        expect(kitAccounts).toHaveLength(4);
        expect(transaction.accounts).toEqual(kitAccounts.map(toTransactionAccount));
        expect(transaction.instructions[0]).toHaveProperty('accounts', kitAccounts.map(toTransactionAccount));
    });

    it('should resolve v0 lookup table accounts exactly as kit decompiles them', () => {
        const tableA = gen.address(10);
        const tableB = gen.address(11);
        const tableAContents = [gen.address(21), gen.address(22), gen.address(23)];
        const tableBContents = [gen.address(31), gen.address(32), gen.address(33)];
        const compiled: CompiledTransactionMessageWithLifetime & V0CompiledTransactionMessage = {
            addressTableLookups: [
                { lookupTableAddress: tableA, readonlyIndexes: [1], writableIndexes: [0, 2] },
                { lookupTableAddress: tableB, readonlyIndexes: [0, 2], writableIndexes: [1] },
            ],
            header: { numReadonlyNonSignerAccounts: 1, numReadonlySignerAccounts: 0, numSignerAccounts: 1 },
            instructions: [{ accountIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8], programAddressIndex: 2 }],
            lifetimeToken: LIFETIME_TOKEN,
            staticAccounts: [gen.address(1), gen.address(2), gen.address(3)],
            version: 0,
        };

        const kitAccounts = firstInstructionAccounts(
            decompileTransactionMessage(compiled, {
                addressesByLookupTableAddress: { [tableA]: tableAContents, [tableB]: tableBContents },
            }),
        );
        const transaction = fromCompiledMessage(compiled, {
            loadedAddresses: {
                readonly: [tableAContents[1], tableBContents[0], tableBContents[2]],
                writable: [tableAContents[0], tableAContents[2], tableBContents[1]],
            },
        });

        expect(kitAccounts).toHaveLength(9);
        expect(transaction.accounts).toEqual(kitAccounts.map(toTransactionAccount));
        expect(transaction.instructions[0]).toHaveProperty('accounts', kitAccounts.map(toTransactionAccount));
    });
});

function firstInstructionAccounts(message: {
    instructions: readonly { accounts?: readonly (AccountLookupMeta | AccountMeta)[] }[];
}): readonly (AccountLookupMeta | AccountMeta)[] {
    return message.instructions[0].accounts ?? [];
}

function toTransactionAccount(meta: AccountLookupMeta | AccountMeta): TransactionAccount {
    return {
        address: meta.address,
        signer: isSignerRole(meta.role),
        writable: isWritableRole(meta.role),
        ...('lookupTableAddress' in meta
            ? { lookupTableAddress: meta.lookupTableAddress, source: 'lookupTable' as const }
            : { source: 'static' as const }),
    };
}

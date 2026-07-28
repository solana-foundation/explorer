import {
    type AccountLookupMeta,
    type AccountMeta,
    type Address,
    type CompiledTransactionMessageWithLifetime,
    decompileTransactionMessage,
    getAddressDecoder,
    isSignerRole,
    isWritableRole,
    type LegacyCompiledTransactionMessage,
    type TransactionVersion as KitTransactionVersion,
    type V0CompiledTransactionMessage,
} from '@solana/kit';
import { describe, expect, expectTypeOf, it } from 'vitest';

import type { ResolvedAccount } from '../types.js';
import type { TransactionVersion } from '../types.js';
import { resolveStaticAccounts, resolveV0Accounts } from '../account-resolver.js';

function testAddress(seed: number): Address {
    return getAddressDecoder().decode(new Uint8Array(32).fill(seed));
}

function toResolvedAccount(meta: AccountMeta | AccountLookupMeta): ResolvedAccount {
    return {
        address: meta.address,
        signer: isSignerRole(meta.role),
        writable: isWritableRole(meta.role),
        ...('lookupTableAddress' in meta
            ? { lookupTableAddress: meta.lookupTableAddress, source: 'lookupTable' }
            : { source: 'static' }),
    };
}

function instructionAccounts(message: {
    instructions: readonly { accounts?: readonly (AccountLookupMeta | AccountMeta)[] }[];
}): readonly (AccountLookupMeta | AccountMeta)[] {
    return message.instructions[0].accounts ?? [];
}

// The account-resolver mirrors kit's account-meta ordering because kit keeps it internal
// (getAccountMetas/getAddressLookupMetas are not exported). The two suites below derive their
// expectations from kit's public decompileTransactionMessage instead — an independent oracle that
// a wrong resolver refactor cannot co-update, and the drift alarm for when v1 (SIMD-0385) support
// forces a resolver rework.
describe('resolveStaticAccounts — kit decompileTransactionMessage as the oracle', () => {
    it('should classify static keys exactly as kit derives roles from the compiled header', () => {
        // fee-payer (writable signer), readonly signer, writable non-signer, readonly non-signer.
        const staticAccounts = [testAddress(1), testAddress(2), testAddress(3), testAddress(4)];
        const compiled: CompiledTransactionMessageWithLifetime & LegacyCompiledTransactionMessage = {
            header: { numReadonlyNonSignerAccounts: 1, numReadonlySignerAccounts: 1, numSignerAccounts: 2 },
            // One instruction referencing every index recovers kit's full account-meta ordering.
            instructions: [{ accountIndices: [0, 1, 2, 3], programAddressIndex: 3 }],
            lifetimeToken: testAddress(9),
            staticAccounts,
            version: 'legacy',
        };

        const kitAccounts = instructionAccounts(decompileTransactionMessage(compiled));
        const result = resolveStaticAccounts({
            header: { numReadonlySignedAccounts: 1, numReadonlyUnsignedAccounts: 1, numRequiredSignatures: 2 },
            staticKeys: [...staticAccounts],
        });

        expect(kitAccounts).toHaveLength(staticAccounts.length);
        expect(result.accountKeys).toEqual(kitAccounts.map(meta => meta.address));
        expect(result.resolvedAccounts).toEqual(kitAccounts.map(toResolvedAccount));
    });
});

describe('resolveV0Accounts — kit decompileTransactionMessage as the oracle', () => {
    it('should order and attribute v0 lookup-table addresses exactly as kit decompiles them', () => {
        const staticAccounts = [testAddress(1), testAddress(2), testAddress(3)];
        const lookupTableA = testAddress(10);
        const lookupTableB = testAddress(11);
        const tableAContents = [testAddress(21), testAddress(22), testAddress(23)];
        const tableBContents = [testAddress(31), testAddress(32), testAddress(33)];
        const compiled: CompiledTransactionMessageWithLifetime & V0CompiledTransactionMessage = {
            addressTableLookups: [
                { lookupTableAddress: lookupTableA, readonlyIndexes: [1], writableIndexes: [0, 2] },
                { lookupTableAddress: lookupTableB, readonlyIndexes: [0, 2], writableIndexes: [1] },
            ],
            header: { numReadonlyNonSignerAccounts: 1, numReadonlySignerAccounts: 0, numSignerAccounts: 1 },
            instructions: [{ accountIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8], programAddressIndex: 2 }],
            lifetimeToken: testAddress(9),
            staticAccounts,
            version: 0,
        };

        const kitAccounts = instructionAccounts(
            decompileTransactionMessage(compiled, {
                addressesByLookupTableAddress: {
                    [lookupTableA]: tableAContents,
                    [lookupTableB]: tableBContents,
                },
            }),
        );
        // The json envelope flattens loaded addresses writable-first across lookups, in lookup order.
        const result = resolveV0Accounts({
            addressTableLookups: [
                { accountKey: lookupTableA, readonlyIndexes: [1], writableIndexes: [0, 2] },
                { accountKey: lookupTableB, readonlyIndexes: [0, 2], writableIndexes: [1] },
            ],
            header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 1, numRequiredSignatures: 1 },
            loadedAddresses: {
                readonly: [tableAContents[1], tableBContents[0], tableBContents[2]],
                writable: [tableAContents[0], tableAContents[2], tableBContents[1]],
            },
            staticKeys: [...staticAccounts],
        });

        expect(kitAccounts).toHaveLength(9);
        expect(result.accountKeys).toEqual(kitAccounts.map(meta => meta.address));
        expect(result.resolvedAccounts).toEqual(kitAccounts.map(toResolvedAccount));
        expect(result.lookupCountsMismatch).toBeUndefined();
    });
});

// Our version union is a deliberate subset of kit's: normalizeVersion rejects v1 (SIMD-0385)
// until the package supports it. These pins surface any movement in kit's vocabulary.
describe('TransactionVersion — kit vocabulary pin', () => {
    it('should emit only versions kit recognizes', () => {
        expectTypeOf<Exclude<TransactionVersion, null>>().toExtend<KitTransactionVersion>();
    });

    // Fails when kit widens its version union — re-decide normalizeVersion's strict rejection then.
    it("should pin kit's version vocabulary to legacy, 0 and 1", () => {
        expectTypeOf<KitTransactionVersion>().toEqualTypeOf<'legacy' | 0 | 1>();
    });
});

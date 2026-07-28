import { describe, expect, it } from 'vitest';

import type { ResolvedAccount } from '../types.js';
import { resolveStaticAccounts, resolveV0Accounts, selectAccountResolver } from '../account-resolver.js';

type Role = { address: string; signer: boolean; writable: boolean };

function staticAccount(role: Role): ResolvedAccount {
    return { ...role, source: 'static' };
}

function lookupTableAccount(role: Role, lookupTableAddress?: string): ResolvedAccount {
    return { ...role, source: 'lookupTable', ...(lookupTableAddress != null && { lookupTableAddress }) };
}

describe('resolveStaticAccounts', () => {
    it('should classify a single signer with no readonly accounts', () => {
        const result = resolveStaticAccounts({
            header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 0, numRequiredSignatures: 1 },
            staticKeys: ['fee-payer', 'other'],
        });

        expect(result.accountKeys).toEqual(['fee-payer', 'other']);
        expect(result.resolvedAccounts).toEqual([
            staticAccount({ address: 'fee-payer', signer: true, writable: true }),
            staticAccount({ address: 'other', signer: false, writable: true }),
        ]);
    });

    it('should classify mixed signers with readonly signed and unsigned accounts', () => {
        const result = resolveStaticAccounts({
            header: { numReadonlySignedAccounts: 1, numReadonlyUnsignedAccounts: 1, numRequiredSignatures: 2 },
            staticKeys: ['fee-payer', 'readonly-signer', 'writable-nonsigner', 'program'],
        });

        expect(result.resolvedAccounts).toEqual([
            staticAccount({ address: 'fee-payer', signer: true, writable: true }),
            staticAccount({ address: 'readonly-signer', signer: true, writable: false }),
            staticAccount({ address: 'writable-nonsigner', signer: false, writable: true }),
            staticAccount({ address: 'program', signer: false, writable: false }),
        ]);
    });

    it('should classify multiple readonly signers', () => {
        const result = resolveStaticAccounts({
            header: { numReadonlySignedAccounts: 2, numReadonlyUnsignedAccounts: 0, numRequiredSignatures: 3 },
            staticKeys: ['fee-payer', 'cosigner-ro-1', 'cosigner-ro-2', 'other'],
        });

        expect(result.resolvedAccounts).toEqual([
            staticAccount({ address: 'fee-payer', signer: true, writable: true }),
            staticAccount({ address: 'cosigner-ro-1', signer: true, writable: false }),
            staticAccount({ address: 'cosigner-ro-2', signer: true, writable: false }),
            staticAccount({ address: 'other', signer: false, writable: true }),
        ]);
    });

    it('should mark all accounts writable when both readonly counts are zero', () => {
        const result = resolveStaticAccounts({
            header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 0, numRequiredSignatures: 2 },
            staticKeys: ['signer-a', 'signer-b', 'other'],
        });

        expect(result.resolvedAccounts).toEqual([
            staticAccount({ address: 'signer-a', signer: true, writable: true }),
            staticAccount({ address: 'signer-b', signer: true, writable: true }),
            staticAccount({ address: 'other', signer: false, writable: true }),
        ]);
    });

    it('should return accountKeys identical to the staticKeys input', () => {
        const staticKeys = ['a', 'b', 'c'];
        const result = resolveStaticAccounts({
            header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 0, numRequiredSignatures: 1 },
            staticKeys,
        });

        expect(result.accountKeys).toEqual(staticKeys);
    });

    it('should ignore loadedAddresses when provided', () => {
        const result = resolveStaticAccounts({
            header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 1, numRequiredSignatures: 1 },
            loadedAddresses: { readonly: ['alt-r1'], writable: ['alt-w1'] },
            staticKeys: ['signer', 'program'],
        });

        expect(result.accountKeys).toEqual(['signer', 'program']);
        expect(result.resolvedAccounts).toHaveLength(2);
        expect(result.resolvedAccounts.every(account => account.source === 'static')).toBe(true);
    });
});

describe('resolveV0Accounts', () => {
    it('should merge static keys with loaded writable and readonly addresses', () => {
        const result = resolveV0Accounts({
            header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 1, numRequiredSignatures: 1 },
            loadedAddresses: { readonly: ['alt-r1'], writable: ['alt-w1', 'alt-w2'] },
            staticKeys: ['signer', 'program', 'readonly'],
        });

        expect(result.accountKeys).toEqual(['signer', 'program', 'readonly', 'alt-w1', 'alt-w2', 'alt-r1']);
        expect(result.resolvedAccounts).toEqual([
            staticAccount({ address: 'signer', signer: true, writable: true }),
            staticAccount({ address: 'program', signer: false, writable: true }),
            staticAccount({ address: 'readonly', signer: false, writable: false }),
            lookupTableAccount({ address: 'alt-w1', signer: false, writable: true }),
            lookupTableAccount({ address: 'alt-w2', signer: false, writable: true }),
            lookupTableAccount({ address: 'alt-r1', signer: false, writable: false }),
        ]);
    });

    it('should tag loaded accounts with their lookup table address', () => {
        const result = resolveV0Accounts({
            addressTableLookups: [
                { accountKey: 'ALT-A', readonlyIndexes: [1], writableIndexes: [0, 3] },
                { accountKey: 'ALT-B', readonlyIndexes: [], writableIndexes: [2] },
            ],
            header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 0, numRequiredSignatures: 1 },
            loadedAddresses: { readonly: ['alt-r1'], writable: ['alt-w1', 'alt-w2', 'alt-w3'] },
            staticKeys: ['signer'],
        });

        expect(result.resolvedAccounts).toEqual([
            staticAccount({ address: 'signer', signer: true, writable: true }),
            lookupTableAccount({ address: 'alt-w1', signer: false, writable: true }, 'ALT-A'),
            lookupTableAccount({ address: 'alt-w2', signer: false, writable: true }, 'ALT-A'),
            lookupTableAccount({ address: 'alt-w3', signer: false, writable: true }, 'ALT-B'),
            lookupTableAccount({ address: 'alt-r1', signer: false, writable: false }, 'ALT-A'),
        ]);
    });

    it('should flag a mismatch when the lookup indexes do not cover the loaded writable addresses', () => {
        const result = resolveV0Accounts({
            addressTableLookups: [{ accountKey: 'ALT-A', readonlyIndexes: [0], writableIndexes: [0] }],
            header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 0, numRequiredSignatures: 1 },
            loadedAddresses: { readonly: ['alt-r1'], writable: ['alt-w1', 'alt-w2'] },
            staticKeys: ['signer'],
        });

        expect(result.lookupCountsMismatch).toBe(true);
    });

    it('should flag a mismatch when the lookup indexes do not cover the loaded readonly addresses', () => {
        const result = resolveV0Accounts({
            addressTableLookups: [{ accountKey: 'ALT-A', readonlyIndexes: [], writableIndexes: [0] }],
            header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 0, numRequiredSignatures: 1 },
            loadedAddresses: { readonly: ['alt-r1'], writable: ['alt-w1'] },
            staticKeys: ['signer'],
        });

        expect(result.lookupCountsMismatch).toBe(true);
    });

    it('should not flag a mismatch when the lookup indexes match the loaded addresses', () => {
        const result = resolveV0Accounts({
            addressTableLookups: [{ accountKey: 'ALT-A', readonlyIndexes: [1], writableIndexes: [0] }],
            header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 0, numRequiredSignatures: 1 },
            loadedAddresses: { readonly: ['alt-r1'], writable: ['alt-w1'] },
            staticKeys: ['signer'],
        });

        expect(result.lookupCountsMismatch).toBeUndefined();
    });

    it('should omit lookupTableAddress when addressTableLookups is not provided', () => {
        const result = resolveV0Accounts({
            header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 0, numRequiredSignatures: 1 },
            loadedAddresses: { readonly: [], writable: ['alt-w1'] },
            staticKeys: ['signer'],
        });

        const loaded = result.resolvedAccounts[1];
        expect(loaded.source).toBe('lookupTable');
        expect(loaded).not.toHaveProperty('lookupTableAddress');
    });

    it('should behave like the static resolver when loadedAddresses is null', () => {
        const result = resolveV0Accounts({
            header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 1, numRequiredSignatures: 1 },
            loadedAddresses: null,
            staticKeys: ['signer', 'program'],
        });

        expect(result.accountKeys).toEqual(['signer', 'program']);
        expect(result.resolvedAccounts).toEqual([
            staticAccount({ address: 'signer', signer: true, writable: true }),
            staticAccount({ address: 'program', signer: false, writable: false }),
        ]);
    });

    it('should behave like the static resolver when loadedAddresses arrays are empty', () => {
        const result = resolveV0Accounts({
            header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 1, numRequiredSignatures: 1 },
            loadedAddresses: { readonly: [], writable: [] },
            staticKeys: ['signer', 'program'],
        });

        expect(result.accountKeys).toEqual(['signer', 'program']);
        expect(result.resolvedAccounts).toHaveLength(2);
    });

    it('should append only loaded writable addresses when there are no loaded readonly ones', () => {
        const result = resolveV0Accounts({
            header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 0, numRequiredSignatures: 1 },
            loadedAddresses: { readonly: [], writable: ['alt-w1'] },
            staticKeys: ['signer'],
        });

        expect(result.accountKeys).toEqual(['signer', 'alt-w1']);
        expect(result.resolvedAccounts[1]).toEqual(
            lookupTableAccount({ address: 'alt-w1', signer: false, writable: true }),
        );
    });

    it('should append only loaded readonly addresses when there are no loaded writable ones', () => {
        const result = resolveV0Accounts({
            header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 0, numRequiredSignatures: 1 },
            loadedAddresses: { readonly: ['alt-r1'], writable: [] },
            staticKeys: ['signer'],
        });

        expect(result.accountKeys).toEqual(['signer', 'alt-r1']);
        expect(result.resolvedAccounts[1]).toEqual(
            lookupTableAccount({ address: 'alt-r1', signer: false, writable: false }),
        );
    });
});

describe('selectAccountResolver', () => {
    it('should return resolveStaticAccounts for legacy transactions', () => {
        expect(selectAccountResolver('legacy')).toBe(resolveStaticAccounts);
    });

    it('should return resolveStaticAccounts for null version', () => {
        expect(selectAccountResolver(null)).toBe(resolveStaticAccounts);
    });

    it('should return resolveV0Accounts for version 0', () => {
        expect(selectAccountResolver(0)).toBe(resolveV0Accounts);
    });

    it('should produce different v0 output than static when loadedAddresses are present', () => {
        const params = {
            header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 0, numRequiredSignatures: 1 },
            loadedAddresses: { readonly: [], writable: ['alt-w1'] },
            staticKeys: ['signer'],
        };

        const v0Result = selectAccountResolver(0)(params);
        const legacyResult = selectAccountResolver('legacy')(params);

        expect(v0Result.accountKeys).toHaveLength(2);
        expect(legacyResult.accountKeys).toHaveLength(1);
    });
});

import { describe, expect, it } from 'vitest';

import { gen } from '../../__tests__/gen.js';
import { resolveAccounts } from '../accounts.js';

const HEADER = { numReadonlyNonSignerAccounts: 1, numReadonlySignerAccounts: 1, numSignerAccounts: 2 };

describe('resolveAccounts', () => {
    it('should classify static keys by the header counts', () => {
        const staticKeys = [gen.address(1), gen.address(2), gen.address(3), gen.address(4)];

        const { accounts } = resolveAccounts({ header: HEADER, staticKeys, version: 'legacy' });

        expect(accounts).toEqual([
            { address: staticKeys[0], signer: true, source: 'static', writable: true },
            { address: staticKeys[1], signer: true, source: 'static', writable: false },
            { address: staticKeys[2], signer: false, source: 'static', writable: true },
            { address: staticKeys[3], signer: false, source: 'static', writable: false },
        ]);
    });

    it('should append lookup table addresses for v0, writable first', () => {
        const staticKeys = [gen.address(1), gen.address(2), gen.address(3), gen.address(4)];
        const table = gen.address(9);

        const { accounts } = resolveAccounts({
            addressTableLookups: [{ accountKey: table, readonlyIndexes: [1], writableIndexes: [0] }],
            header: HEADER,
            loadedAddresses: { readonly: [gen.address(6)], writable: [gen.address(5)] },
            staticKeys,
            version: 0,
        });

        expect(accounts.slice(4)).toEqual([
            {
                address: gen.address(5),
                lookupTableAddress: table,
                signer: false,
                source: 'lookupTable',
                writable: true,
            },
            {
                address: gen.address(6),
                lookupTableAddress: table,
                signer: false,
                source: 'lookupTable',
                writable: false,
            },
        ]);
    });

    it('should return the supplying table for addresses loaded from two lookup tables', () => {
        const tableA = gen.address(10);
        const tableB = gen.address(11);
        const staticKeys = [gen.address(1)];
        const writable = [gen.address(2), gen.address(3), gen.address(4)];
        const readonly = [gen.address(5), gen.address(6), gen.address(7)];

        const { accounts } = resolveAccounts({
            addressTableLookups: [
                { accountKey: tableA, readonlyIndexes: [1, 5], writableIndexes: [0, 3] },
                { accountKey: tableB, readonlyIndexes: [4], writableIndexes: [2] },
            ],
            header: { numReadonlyNonSignerAccounts: 0, numReadonlySignerAccounts: 0, numSignerAccounts: 1 },
            loadedAddresses: { readonly, writable },
            staticKeys,
            version: 0,
        });

        expect(accounts.slice(1)).toEqual([
            { address: writable[0], lookupTableAddress: tableA, signer: false, source: 'lookupTable', writable: true },
            { address: writable[1], lookupTableAddress: tableA, signer: false, source: 'lookupTable', writable: true },
            { address: writable[2], lookupTableAddress: tableB, signer: false, source: 'lookupTable', writable: true },
            {
                address: readonly[0],
                lookupTableAddress: tableA,
                signer: false,
                source: 'lookupTable',
                writable: false,
            },
            {
                address: readonly[1],
                lookupTableAddress: tableA,
                signer: false,
                source: 'lookupTable',
                writable: false,
            },
            {
                address: readonly[2],
                lookupTableAddress: tableB,
                signer: false,
                source: 'lookupTable',
                writable: false,
            },
        ]);
    });

    it('should return unmatched writable addresses', () => {
        const result = resolveAccounts({
            addressTableLookups: [{ accountKey: gen.address(9), readonlyIndexes: [], writableIndexes: [0] }],
            header: HEADER,
            loadedAddresses: { readonly: [], writable: [gen.address(5), gen.address(6)] },
            staticKeys: [gen.address(1), gen.address(2), gen.address(3), gen.address(4)],
            version: 0,
        });

        expect(result.unmatchedLookupTableAddresses).toEqual([gen.address(6)]);
    });

    it('should return unmatched readonly addresses', () => {
        const result = resolveAccounts({
            addressTableLookups: [{ accountKey: gen.address(9), readonlyIndexes: [], writableIndexes: [0] }],
            header: HEADER,
            loadedAddresses: { readonly: [gen.address(6)], writable: [gen.address(5)] },
            staticKeys: [gen.address(1), gen.address(2), gen.address(3), gen.address(4)],
            version: 0,
        });

        expect(result.unmatchedLookupTableAddresses).toEqual([gen.address(6)]);
    });

    it('should return unfilled lookup indexes grouped by table', () => {
        const tableA = gen.address(10);
        const tableB = gen.address(11);

        const result = resolveAccounts({
            addressTableLookups: [
                { accountKey: tableA, readonlyIndexes: [], writableIndexes: [4, 7] },
                { accountKey: tableB, readonlyIndexes: [5], writableIndexes: [2] },
            ],
            header: HEADER,
            loadedAddresses: { readonly: [], writable: [gen.address(5)] },
            staticKeys: [gen.address(1), gen.address(2), gen.address(3), gen.address(4)],
            version: 0,
        });

        expect(result.unmatchedLookupTableIndexes).toEqual([
            { accountKey: tableA, readonlyIndexes: [], writableIndexes: [7] },
            { accountKey: tableB, readonlyIndexes: [5], writableIndexes: [2] },
        ]);
        expect(result.unmatchedLookupTableAddresses).toBeUndefined();
    });

    it('should report nothing unmatched when lookups and loaded addresses line up', () => {
        const result = resolveAccounts({
            addressTableLookups: [{ accountKey: gen.address(9), readonlyIndexes: [1], writableIndexes: [0] }],
            header: HEADER,
            loadedAddresses: { readonly: [gen.address(6)], writable: [gen.address(5)] },
            staticKeys: [gen.address(1), gen.address(2), gen.address(3), gen.address(4)],
            version: 0,
        });

        expect(result.unmatchedLookupTableAddresses).toBeUndefined();
        expect(result.unmatchedLookupTableIndexes).toBeUndefined();
    });

    it('should not return unmatched addresses for tx without lookup tables', () => {
        const { accounts, unmatchedLookupTableAddresses } = resolveAccounts({
            header: HEADER,
            loadedAddresses: { readonly: [], writable: [gen.address(5)] },
            staticKeys: [gen.address(1), gen.address(2), gen.address(3), gen.address(4)],
            version: 0,
        });

        expect(accounts[4]).toEqual({ address: gen.address(5), signer: false, source: 'lookupTable', writable: true });
        expect(unmatchedLookupTableAddresses).toBeUndefined();
    });

    it('should return static keys only for v0 without loaded addresses', () => {
        const staticKeys = [gen.address(1), gen.address(2), gen.address(3), gen.address(4)];

        const result = resolveAccounts({ header: HEADER, loadedAddresses: null, staticKeys, version: 0 });

        expect(result.accounts).toHaveLength(4);
        expect(result.unmatchedLookupTableAddresses).toBeUndefined();
    });

    it('should reject v0 lookup table slots without loaded addresses', () => {
        const staticKeys = [gen.address(1), gen.address(2), gen.address(3), gen.address(4)];

        expect(() =>
            resolveAccounts({
                addressTableLookups: [{ accountKey: gen.address(9), readonlyIndexes: [1], writableIndexes: [0] }],
                header: HEADER,
                staticKeys,
                version: 0,
            }),
        ).toThrow('Missing loadedAddresses: the v0 message loads 2 accounts from lookup tables.');
    });

    it('should report every v0 lookup table slot as unmatched when the loaded addresses are empty', () => {
        const staticKeys = [gen.address(1), gen.address(2), gen.address(3), gen.address(4)];
        const lookup = { accountKey: gen.address(9), readonlyIndexes: [1], writableIndexes: [0] };

        const result = resolveAccounts({
            addressTableLookups: [lookup],
            header: HEADER,
            loadedAddresses: { readonly: [], writable: [] },
            staticKeys,
            version: 0,
        });

        expect(result.accounts).toHaveLength(4);
        expect(result.unmatchedLookupTableIndexes).toEqual([lookup]);
    });

    it('should ignore loaded addresses for v1', () => {
        const staticKeys = [gen.address(1), gen.address(2), gen.address(3), gen.address(4)];

        const { accounts } = resolveAccounts({
            header: HEADER,
            loadedAddresses: { readonly: [gen.address(6)], writable: [gen.address(5)] },
            staticKeys,
            version: 1,
        });

        expect(accounts).toHaveLength(4);
    });
});

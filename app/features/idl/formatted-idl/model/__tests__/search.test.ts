import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { FormattedIdl } from '@/app/entities/idl/formatters/formatted-idl';

import { contains, useSearchIdl } from '../search';

describe('useSearchIdl', () => {
    it('should return null when formattedIdl is null', () => {
        const { result } = renderHook(() => useSearchIdl(null, 'test'));
        expect(result.current).toBeNull();
    });

    it('should filter IDL by search term', () => {
        const formattedIdl: FormattedIdl = {
            accounts: [
                {
                    docs: [],
                    fieldType: null,
                    name: 'AddressMerkleTreeAccount',
                },
            ],
            instructions: [
                {
                    accounts: [],
                    args: [],
                    docs: [],
                    name: 'initializeAddressMerkleTreeAndQueue',
                },
                {
                    accounts: [],
                    args: [],
                    docs: [],
                    name: 'insertAddresses',
                },
            ],
        };

        const { result } = renderHook(() => useSearchIdl(formattedIdl, 'address'));

        expect(result.current?.instructions).toEqual([
            {
                accounts: [],
                args: [],
                docs: [],
                name: 'insertAddresses',
            },
            {
                accounts: [],
                args: [],
                docs: [],
                name: 'initializeAddressMerkleTreeAndQueue',
            },
        ]);

        expect(result.current?.accounts).toEqual([
            {
                docs: [],
                fieldType: null,
                name: 'AddressMerkleTreeAccount',
            },
        ]);
    });
});

describe('contains', () => {
    it('should return true when text contains search term', () => {
        expect(contains('Hello World', 'Hello')).toBe(true);
        expect(contains('Hello World', 'world')).toBe(true);
    });

    it('should return false when text does not contain search term', () => {
        expect(contains('Hello World', 'xyz')).toBe(false);
    });
});

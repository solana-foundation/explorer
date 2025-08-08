import { bytesToHex } from '@noble/hashes/utils';
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import { useFormatAnchorIdl } from '../anchor';
import {
    EnumFieldType,
    NestedInstructionAccountsData,
    StructFieldType,
    TypeFieldType,
    UnknownFieldType,
} from '../FormattedIdl';

// Mock byte to hex utility since we don't need actual conversion in tests
vi.mock('@noble/hashes/utils', () => ({
    bytesToHex: (data: Uint8Array) => `0x${Buffer.from(data).toString('hex')}`,
}));

describe('useFormatAnchorIdl', () => {
    it('should return null when idl is undefined', () => {
        const { result } = renderHook(() => useFormatAnchorIdl(undefined));
        expect(result.current).toBeNull();
    });

    it('should format a minimal valid IDL correctly', () => {
        const minimalIdl = {
            instructions: [
                {
                    accounts: [],
                    args: [],
                    name: 'initialize',
                },
            ],
        };

        const { result } = renderHook(() => useFormatAnchorIdl(minimalIdl as any));

        expect(result.current).not.toBeNull();
        expect(result.current?.instructions).toHaveLength(1);
        expect(result.current?.instructions?.[0].name).toBe('initialize');
    });

    it('should format instruction names using camelCase', () => {
        const idl = {
            instructions: [
                {
                    accounts: [],
                    args: [],
                    name: 'initialize_account',
                },
                {
                    accounts: [],
                    args: [],
                    name: 'UPDATE_STATE',
                },
            ],
        };

        const { result } = renderHook(() => useFormatAnchorIdl(idl as any));

        expect(result.current?.instructions?.[0].name).toBe('initializeAccount');
        expect(result.current?.instructions?.[1].name).toBe('updateState');
    });

    it('should correctly format instruction accounts', () => {
        const idl = {
            instructions: [
                {
                    accounts: [
                        { name: 'authority', signer: true, writable: true },
                        { name: 'systemAccount', signer: false, writable: true },
                    ],
                    args: [],
                    name: 'initialize',
                },
            ],
        };

        const { result } = renderHook(() => useFormatAnchorIdl(idl as any));

        const accounts = result.current?.instructions?.[0].accounts;
        expect(accounts).toHaveLength(2);
        expect(accounts?.[0]).toMatchObject({
            docs: [],
            name: 'authority',
            optional: false,
            pda: false,
            signer: true,
            writable: true,
        });
    });

    it('should correctly format nested instruction accounts', () => {
        const idl = {
            instructions: [
                {
                    accounts: [
                        {
                            accounts: [
                                { name: 'authority', signer: true, writable: false },
                                { name: 'userAccount', optional: true, pda: true, signer: false, writable: true },
                            ],
                            name: 'userGroup',
                        },
                    ],
                    args: [],
                    name: 'initialize',
                },
            ],
        };

        const { result } = renderHook(() => useFormatAnchorIdl(idl as any));

        const accounts = result.current?.instructions?.[0].accounts;
        expect(accounts).toHaveLength(1);
        expect(accounts?.[0]).toHaveProperty('accounts');
        expect((accounts?.[0] as NestedInstructionAccountsData).accounts).toHaveLength(2);
        expect((accounts?.[0] as NestedInstructionAccountsData).name).toBe('userGroup');
        expect((accounts?.[0] as NestedInstructionAccountsData).accounts[0]).toMatchObject({
            docs: [],
            name: 'authority',
            optional: false,
            pda: false,
            signer: true,
            writable: false,
        });
        expect((accounts?.[0] as NestedInstructionAccountsData).accounts[1]).toMatchObject({
            docs: [],
            name: 'userAccount',
            optional: true,
            pda: true,
            signer: false,
            writable: true,
        });
    });

    it('should correctly format instruction args', () => {
        const idl = {
            instructions: [
                {
                    accounts: [],
                    args: [
                        { name: 'amount', type: 'u64' },
                        { name: 'message', type: 'string' },
                    ],
                    name: 'initialize',
                },
            ],
        };

        const { result } = renderHook(() => useFormatAnchorIdl(idl as any));

        const args = result.current?.instructions?.[0].args;
        expect(args).toHaveLength(2);
        expect(args?.[0]).toMatchObject({
            name: 'amount',
            type: 'u64',
        });
        expect(args?.[1]).toMatchObject({
            name: 'message',
            type: 'string',
        });
    });

    it('should handle accounts section correctly', () => {
        const idl = {
            accounts: [{ name: 'UserAccount' }],
            instructions: [],
            types: [
                {
                    name: 'UserAccount',
                    type: {
                        fields: [
                            { name: 'authority', type: 'publicKey' },
                            { name: 'balance', type: 'u64' },
                            { name: 'isInitialized', type: 'bool' },
                            { name: 'counter', type: 'u32' },
                        ],
                        kind: 'struct',
                    },
                },
            ],
        };

        const { result } = renderHook(() => useFormatAnchorIdl(idl as any));

        const accounts = result.current?.accounts;
        expect(accounts).toHaveLength(1);
        expect(accounts?.[0].name).toBe('UserAccount');
        expect(accounts?.[0].fieldType?.kind).toBe('struct');
        expect((accounts?.[0].fieldType as StructFieldType).fields).toHaveLength(4);
        (accounts?.[0].fieldType as StructFieldType).fields?.forEach((field, i) => {
            expect(field.name).toEqual(idl.types[0].type.fields[i].name);
            expect(field).toHaveProperty('type');
        });
    });

    it('should handle struct and unknown type fields correctly', () => {
        const idl = {
            instructions: [],
            types: [
                {
                    name: 'UserInfo',
                    type: {
                        fields: [
                            { name: 'name', type: 'string' },
                            { name: 'active', type: 'bool' },
                        ],
                        kind: 'struct',
                    },
                },
                {
                    name: 'Unknown',
                    type: {
                        data: [
                            { name: 'test', type: 'u64' },
                            { name: 'active', type: 'bool' },
                        ],
                        kind: 'test',
                    },
                },
            ],
        };

        const { result } = renderHook(() => useFormatAnchorIdl(idl as any));

        const types = result.current?.types;
        expect(types).toHaveLength(2);
        expect(types?.[0].fieldType?.kind).toBe('struct');
        const fields = (types?.[0].fieldType as StructFieldType).fields;
        expect(fields?.[0].name).toBe('name');
        expect(fields?.[0].type).toBe('string');
        expect(fields?.[1].name).toBe('active');
        expect(fields?.[1].type).toBe('bool');

        expect(types?.[1].fieldType?.kind).toBe('unknown');
        expect((types?.[1].fieldType as UnknownFieldType)?.type).toBe(
            '{"data":[{"name":"test","type":"u64"},{"name":"active","type":"bool"}],"kind":"test"}'
        );
    });

    it('should handle enum type variants correctly', () => {
        const idl = {
            instructions: [],
            types: [
                {
                    name: 'Status',
                    type: {
                        kind: 'enum',
                        variants: [{ name: 'Active' }, { name: 'Pending' }, { name: 'Closed' }],
                    },
                },
            ],
        };

        const { result } = renderHook(() => useFormatAnchorIdl(idl as any));

        const types = result.current?.types;
        expect(types?.[0].fieldType?.kind).toBe('enum');
        const variants = (types?.[0].fieldType as EnumFieldType).variants;
        expect(variants).toEqual(['Active', 'Pending', 'Closed']);
    });

    it('should handle enum variants with fields correctly', () => {
        const idl = {
            instructions: [],
            types: [
                {
                    name: 'Action',
                    type: {
                        kind: 'enum',
                        variants: [
                            {
                                fields: [
                                    { name: 'amount', type: 'u64' },
                                    { name: 'destination', type: 'publicKey' },
                                ],
                                name: 'Transfer',
                            },
                            { name: 'Close' },
                        ],
                    },
                },
            ],
        };

        const { result } = renderHook(() => useFormatAnchorIdl(idl as any));

        const types = result.current?.types;
        const variants = (types?.[0].fieldType as EnumFieldType).variants;
        expect(variants[0]).toContain('Transfer');
        expect(variants[0]).toContain('{"amount":"u64","destination":"publicKey"}');
        expect(variants[1]).toBe('Close');
    });

    it('should handle enum variants with tuple fields correctly', () => {
        const idl = {
            instructions: [],
            types: [
                {
                    name: 'Payload',
                    type: {
                        kind: 'enum',
                        variants: [
                            {
                                fields: ['u64', 'bool'],
                                name: 'Data',
                            },
                            { name: 'Empty' },
                        ],
                    },
                },
            ],
        };

        const { result } = renderHook(() => useFormatAnchorIdl(idl as any));

        const types = result.current?.types;
        const variants = (types?.[0].fieldType as any).variants;
        expect(variants[0]).toBe('Data [u64, bool]');
        expect(variants[1]).toBe('Empty');
    });

    it('should correctly parse complex data types', () => {
        const idl = {
            instructions: [],
            types: [
                {
                    name: 'ComplexType',
                    type: {
                        fields: [
                            { name: 'optional_value', type: { option: 'u64' } },
                            { name: 'vector_of_keys', type: { vec: 'publicKey' } },
                            { name: 'fixed_array', type: { array: ['u8', 32] } },
                            { name: 'defined_type', type: { defined: 'CustomType' } },
                            { name: 'coption_value', type: { coption: 'string' } },
                            {
                                name: 'remaining_accounts_info',
                                type: { vec: { defined: { name: 'RemainingAccountsSlice' } } },
                            },
                        ],
                        kind: 'struct',
                    },
                },
                {
                    name: 'RemainingAccountsSlice',
                    type: {
                        fields: [
                            {
                                name: 'accounts_type',
                                type: {
                                    defined: {
                                        name: 'AccountsType',
                                    },
                                },
                            },
                            {
                                name: 'length',
                                type: 'u8',
                            },
                        ],
                        kind: 'struct',
                    },
                },
            ],
        };

        const { result } = renderHook(() => useFormatAnchorIdl(idl as any));

        const fields = (result.current?.types?.[0].fieldType as any).fields;
        expect(fields[0].name).toBe('optionalValue');
        expect(fields[0].type).toBe('option(u64)');

        expect(fields[1].name).toBe('vectorOfKeys');
        expect(fields[1].type).toBe('vec(publicKey)');

        expect(fields[2].name).toBe('fixedArray');
        expect(fields[2].type).toBe('array(u8, 32)');

        expect(fields[3].name).toBe('definedType');
        expect(fields[3].type).toBe('CustomType');

        expect(fields[4].name).toBe('coptionValue');
        expect(fields[4].type).toBe('coption(string)');

        expect(fields[5].name).toBe('remainingAccountsInfo');
        expect(fields[5].type).toBe('vec(RemainingAccountsSlice)');
    });

    it('should correctly extract PDAs from instruction accounts', () => {
        const seedConstBuff = [117, 115, 101, 114, 95, 114, 101, 119, 97, 114, 100, 115];
        const idl = {
            instructions: [
                {
                    accounts: [
                        { name: 'authority', signer: true, writable: false },
                        {
                            name: 'userAccount',
                            pda: {
                                seeds: [
                                    { kind: 'const', value: seedConstBuff },
                                    { kind: 'account', path: 'authority' },
                                ],
                            },
                            signer: false,
                            writable: true,
                        },
                    ],
                    args: [],
                    name: 'createUser',
                },
            ],
        };

        const { result } = renderHook(() => useFormatAnchorIdl(idl as any));

        const pdas = result.current?.pdas;
        expect(pdas).toHaveLength(1);
        expect(pdas?.[0].name).toBe('userAccount');
        expect(pdas?.[0].seeds).toHaveLength(2);
        expect(pdas?.[0].seeds[0].kind).toBe('type');
        expect((pdas?.[0].seeds[0] as TypeFieldType).type).toBe('seed');
        expect((pdas?.[0].seeds[0] as TypeFieldType).name).toBe(bytesToHex(Uint8Array.from([...seedConstBuff])));
        expect((pdas?.[0].seeds[1] as TypeFieldType).name).toBe('authority');
        expect((pdas?.[0].seeds[1] as TypeFieldType).type).toBe('pubkey');
    });

    it('should deduplicate PDAs that appear in multiple instructions', () => {
        const idl = {
            instructions: [
                {
                    accounts: [
                        {
                            name: 'userAccount',
                            pda: { seeds: [] },
                            signer: false,
                            writable: true,
                        },
                    ],
                    args: [],
                    name: 'createUser',
                },
                {
                    accounts: [
                        {
                            name: 'userAccount',
                            pda: { seeds: [] },
                            signer: false,
                            writable: true,
                        },
                    ],
                    args: [],
                    name: 'updateUser',
                },
            ],
        };

        const { result } = renderHook(() => useFormatAnchorIdl(idl as any));

        const pdas = result.current?.pdas;
        expect(pdas).toHaveLength(1);
        expect(pdas?.[0].name).toBe('userAccount');
    });

    it('should handle errors section correctly', () => {
        const idl = {
            errors: [
                { code: 6000, msg: 'The provided input is invalid', name: 'InvalidInput' },
                { code: 6001, msg: 'You are not authorized to perform this action', name: 'Unauthorized' },
            ],
            instructions: [],
        };

        const { result } = renderHook(() => useFormatAnchorIdl(idl as any));

        const errors = result.current?.errors;
        expect(errors).toHaveLength(2);
        idl.errors.forEach((err, i) => {
            expect(errors?.[i]).toMatchObject({
                code: err.code.toString(),
                message: err.msg,
                name: err.name,
            });
        });
    });

    it('should handle constants section correctly', () => {
        const idl = {
            constants: [
                { name: 'MAX_USERS', type: 'u8', value: '100' },
                { name: 'PROGRAM_VERSION', type: 'string', value: '"1.0.0"' },
            ],
            instructions: [],
        };

        const { result } = renderHook(() => useFormatAnchorIdl(idl as any));

        const constants = result.current?.constants;
        expect(constants).toHaveLength(2);
        expect(constants?.[0]).toMatchObject({
            name: 'MAX_USERS',
            type: 'u8',
            value: 100,
        });
        expect(constants?.[1]).toMatchObject({
            name: 'PROGRAM_VERSION',
            type: 'string',
            value: '1.0.0',
        });
    });

    it('should handle events section correctly', () => {
        const idl = {
            events: [
                {
                    name: 'UserCreated',
                },
            ],
            instructions: [],
            types: [
                {
                    name: 'UserCreated',
                    type: {
                        fields: [
                            { name: 'user_id', type: 'u64' },
                            { name: 'authority', type: 'publicKey' },
                        ],
                        kind: 'struct',
                    },
                },
            ],
        };

        const { result } = renderHook(() => useFormatAnchorIdl(idl as any));

        const events = result.current?.events;
        expect(events).toHaveLength(1);
        expect(events?.[0].name).toBe('UserCreated');
        expect(events?.[0].fieldType?.kind).toBe('struct');
        expect((events?.[0].fieldType as StructFieldType)?.fields?.[0].name).toBe('userId');
        expect((events?.[0].fieldType as StructFieldType)?.fields?.[0].type).toBe('u64');
        expect((events?.[0].fieldType as StructFieldType)?.fields?.[1].name).toBe('authority');
        expect((events?.[0].fieldType as StructFieldType)?.fields?.[1].type).toBe('publicKey');
    });

    it('should filter out types that are used as accounts or events', () => {
        const idl = {
            accounts: [{ name: 'UserAccount', type: { fields: [], kind: 'struct' } }],
            events: [{ fields: [], name: 'UserEvent' }],
            instructions: [],
            types: [
                { name: 'UserAccount', type: { fields: [], kind: 'struct' } },
                { name: 'UserEvent', type: { fields: [], kind: 'struct' } },
                { name: 'UniqueTy', type: { fields: [], kind: 'struct' } },
            ],
        };

        const { result } = renderHook(() => useFormatAnchorIdl(idl as any));

        const types = result.current?.types;
        expect(types).toHaveLength(1);
        expect(types?.[0].name).toBe('UniqueTy');
        expect(result.current?.accounts).toHaveLength(1);
        expect(result.current?.events).toHaveLength(1);
    });
});

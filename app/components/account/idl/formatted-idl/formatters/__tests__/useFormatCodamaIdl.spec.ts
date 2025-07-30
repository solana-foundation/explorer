import { renderHook } from '@testing-library/react';

import { useFormatCodamaIdl } from '../codama';
import { EnumFieldType, FieldType, StructFieldType, TypeFieldType } from '../FormattedIdl';
import minimalMock from './codama-mocks/minimalMock';
// simplified versions of codama IDLs
import programMock1 from './codama-mocks/programMock1';
import programMock2 from './codama-mocks/programMock2';
import programMock3 from './codama-mocks/programMock3';
import programMock4 from './codama-mocks/programMock4';

describe('useFormatCodamaIdl', () => {
    it('should return null when idl is undefined', () => {
        const { result } = renderHook(() => useFormatCodamaIdl(undefined));
        expect(result.current).toBeNull();
    });

    it('should format a minimal valid IDL correctly', () => {
        const { result } = renderHook(() => useFormatCodamaIdl(minimalMock as any));

        expect(result.current).not.toBeNull();
        const ixs = result.current?.instructions;
        expect(ixs).toHaveLength(1);
        expect(ixs?.[0].name).toBe('initialize');
        expect(ixs?.[0].args).toHaveLength(1);
        expect(ixs?.[0].accounts).toHaveLength(2);
    });

    it('should correctly format instruction accounts', () => {
        const { result } = renderHook(() => useFormatCodamaIdl(minimalMock as any));

        const accounts = result.current?.instructions?.[0].accounts;
        expect(accounts).toHaveLength(2);
        expect(accounts?.[0]).toMatchObject({
            docs: [],
            name: 'config',
            optional: true,
            pda: false,
            signer: false,
            writable: true,
        });
        expect(accounts?.[1]).toMatchObject({
            docs: [],
            name: 'payer',
            optional: false,
            pda: false,
            signer: true,
            writable: true,
        });
    });

    it('should correctly format instruction args', () => {
        const { result } = renderHook(() => useFormatCodamaIdl(minimalMock as any));

        const args = result.current?.instructions?.[0].args;
        expect(args).toHaveLength(1);
        expect(args?.[0]).toMatchObject({
            name: 'seed',
            type: 'string:utf8',
        });
    });

    it('should handle struct type fields correctly', () => {
        const { result } = renderHook(() => useFormatCodamaIdl(programMock3 as any));

        // Find the Config account type
        const accounts = result.current?.accounts;
        const configAccount = accounts?.find(a => a.name === 'config');

        expect(configAccount?.fieldType?.kind).toBe('struct');
        const fields = (configAccount?.fieldType as StructFieldType).fields;
        expect(fields?.length).toBeGreaterThan(0);

        const field = fields?.[0];
        expect(field?.name).toEqual('admin');
        expect(field?.type).toEqual('pubkey');
    });

    it('should handle enum types correctly', () => {
        const { result } = renderHook(() => useFormatCodamaIdl(programMock2 as any));

        // Find the accountDiscriminator type that should be an enum
        const types = result.current?.types;
        const enumType = types?.find(t => t.name === 'accountDiscriminator');

        expect(enumType?.fieldType?.kind).toBe('enum');
        const variants = (enumType?.fieldType as EnumFieldType).variants;
        expect(variants.length).toEqual(2);
        expect(variants[0]).toEqual('Buffer');
        expect(variants[1]).toEqual('Metadata');
        expect(enumType?.name).toEqual('accountDiscriminator');
    });

    it('should correctly extract PDAs', () => {
        const { result } = renderHook(() => useFormatCodamaIdl(programMock2 as any));

        const pdas = result.current?.pdas;
        expect(pdas).toBeDefined();
        expect(pdas?.length).toBeGreaterThan(0);

        // Check one PDA in detail
        const metadataPda = pdas?.find(p => p.name === 'metadata');
        expect(metadataPda?.name).toEqual('metadata');
        expect(metadataPda?.seeds.length).toEqual(3);

        // Verify seed structure
        const seed1 = metadataPda?.seeds[0] as TypeFieldType;
        expect(seed1.kind).toBe('type');
        expect(seed1.name).toEqual('program');
        expect(seed1.type).toEqual('pubkey');

        const seed2 = metadataPda?.seeds[1] as TypeFieldType;
        expect(seed2.kind).toBe('type');
        expect(seed2.name).toEqual('authority');
        expect(seed2.type).toEqual('option(pubkey)');

        const seed3 = metadataPda?.seeds[2] as TypeFieldType;
        expect(seed3.kind).toBe('type');
        expect(seed3.name).toEqual('seed');
        expect(seed3.type).toEqual('seed');
    });

    it('should correctly parse complex data types', () => {
        const { result } = renderHook(() => useFormatCodamaIdl(programMock4 as any));

        const types = result.current?.types;
        expect(types?.length).toEqual(3);

        const type1 = types![0];

        expect(type1.name).toEqual('whirlpoolRewardInfo');
        expect(type1.fieldType?.kind).toEqual('struct');
        expect((type1.fieldType as StructFieldType).fields?.length).toEqual(5);

        const type1Field1 = (type1.fieldType as StructFieldType).fields?.[0];
        expect(type1Field1?.name).toEqual('mint');
        expect(type1Field1?.type).toEqual('pubkey');

        const type1Field2 = (type1.fieldType as StructFieldType).fields?.[1];
        expect(type1Field2?.name).toEqual('vault');
        expect(type1Field2?.type).toEqual('pubkey');

        const type1Field3 = (type1.fieldType as StructFieldType).fields?.[2];
        expect(type1Field3?.name).toEqual('authority');
        expect(type1Field3?.type).toEqual('pubkey');

        const type1Field4 = (type1.fieldType as StructFieldType).fields?.[3];
        expect(type1Field4?.name).toEqual('emissionsPerSecondX64');
        expect(type1Field4?.type).toEqual('u128');

        const type1Field5 = (type1.fieldType as StructFieldType).fields?.[4];
        expect(type1Field5?.name).toEqual('growthGlobalX64');
        expect(type1Field5?.type).toEqual('u128');

        const type2 = types![1];

        expect(type2.name).toEqual('remainingAccountsInfo');
        expect(type2.fieldType?.kind).toEqual('struct');
        expect((type2.fieldType as StructFieldType).fields?.length).toEqual(2);

        const type2Field1 = (type2.fieldType as StructFieldType).fields?.[0];
        expect(type2Field1?.name).toEqual('accountsType');
        expect(type2Field1?.type).toEqual('accountsType');

        const type2Field2 = (type2.fieldType as StructFieldType).fields?.[1];
        expect(type2Field2?.name).toEqual('optionalAccounts');
        expect(type2Field2?.type).toEqual('option(array(bool, 3))');

        const type3 = types![2];

        expect(type3.name).toEqual('accountsType');
        expect(type3.fieldType?.kind).toEqual('enum');
        expect((type3.fieldType as EnumFieldType).variants?.length).toEqual(2);
        expect((type3.fieldType as EnumFieldType).variants).toEqual(['TokenTransferHooks', 'TokenExtraAccountMetas']);
    });

    it('should handle program errors correctly', () => {
        const { result } = renderHook(() => useFormatCodamaIdl(programMock1 as any));

        const errors = result.current?.errors;
        expect(errors).toHaveLength(2);

        const error1 = errors?.[0];
        expect(error1?.code).toEqual('6000');
        expect(error1?.message).toEqual('Program is paused');
        expect(error1?.name).toEqual('programPaused');

        const error2 = errors?.[1];
        expect(error2?.code).toEqual('6001');
        expect(error2?.message).toEqual('Program is already initialized');
        expect(error2?.name).toEqual('programIsAlreadyInitialized');
    });

    it('should deduplicate PDAs that appear in multiple instructions', () => {
        // Create a mock with duplicate PDAs
        const mockWithDuplicatePdas = {
            ...minimalMock,
            program: {
                ...minimalMock.program,
                instructions: [
                    {
                        ...minimalMock.program.instructions[0],
                        accounts: [
                            {
                                defaultValue: {
                                    kind: 'pdaValueNode',
                                    pda: {
                                        kind: 'pdaNode',
                                        name: 'pdaAccount',
                                        seeds: [],
                                    },
                                },
                                docs: [],
                                isOptional: false,
                                isSigner: false,
                                isWritable: true,
                                name: 'pdaAccount',
                            },
                        ],
                    },
                    {
                        ...minimalMock.program.instructions[0],
                        accounts: [
                            {
                                defaultValue: {
                                    kind: 'pdaValueNode',
                                    pda: {
                                        kind: 'pdaNode',
                                        name: 'pdaAccount',
                                        seeds: [],
                                    },
                                },
                                docs: [],
                                isOptional: false,
                                isSigner: false,
                                isWritable: true,
                                name: 'pdaAccount',
                            },
                        ],
                        name: 'anotherIx',
                    },
                ],
            },
        };

        const { result } = renderHook(() => useFormatCodamaIdl(mockWithDuplicatePdas as any));

        const pdas = result.current?.pdas;
        expect(pdas).toBeDefined();
        expect(pdas?.length).toEqual(1);
    });

    it('should parse conditional PDA accounts', () => {
        // Create a mock with conditional PDA
        const mockWithConditionalPda = {
            ...minimalMock,
            program: {
                ...minimalMock.program,
                instructions: [
                    {
                        ...minimalMock.program.instructions[0],
                        accounts: [
                            {
                                defaultValue: {
                                    condition: { boolean: true, kind: 'booleanValueNode' },
                                    ifFalse: {
                                        kind: 'pdaValueNode',
                                        pda: {
                                            kind: 'pdaNode',
                                            name: 'falsePda',
                                            seeds: [],
                                        },
                                    },
                                    ifTrue: {
                                        kind: 'pdaValueNode',
                                        pda: {
                                            kind: 'pdaNode',
                                            name: 'truePda',
                                            seeds: [],
                                        },
                                    },
                                    kind: 'conditionalValueNode',
                                },
                                docs: [],
                                isOptional: false,
                                isSigner: false,
                                isWritable: true,
                                name: 'conditionalAccount',
                            },
                        ],
                    },
                ],
            },
        };

        const { result } = renderHook(() => useFormatCodamaIdl(mockWithConditionalPda as any));

        const pdas = result.current?.pdas;
        expect(pdas).toBeDefined();
        expect(pdas?.length).toBe(2);

        // Should extract both the true and false conditions
        expect(pdas?.some(p => p.name === 'truePda')).toBe(true);
        expect(pdas?.some(p => p.name === 'falsePda')).toBe(true);
    });

    it('should handle PDA links correctly', () => {
        // Create a mock with PDA links
        const mockWithPdaLinks = {
            ...minimalMock,
            program: {
                ...minimalMock.program,
                instructions: [
                    {
                        ...minimalMock.program.instructions[0],
                        accounts: [
                            {
                                defaultValue: {
                                    kind: 'pdaValueNode',
                                    pda: {
                                        kind: 'pdaLinkNode',
                                        name: 'linkedPda',
                                    },
                                },
                                docs: [],
                                isOptional: false,
                                isSigner: false,
                                isWritable: true,
                                name: 'pdaAccount',
                            },
                        ],
                    },
                ],
                pdas: [
                    {
                        docs: ['Linked PDA docs'],
                        kind: 'pdaNode',
                        name: 'linkedPda',
                        seeds: [
                            {
                                docs: ['Seed 1 docs'],
                                kind: 'variablePdaSeedNode',
                                name: 'seed1',
                                type: { encoding: 'utf8', kind: 'stringTypeNode' },
                            },
                        ],
                    },
                ],
            },
        };

        const { result } = renderHook(() => useFormatCodamaIdl(mockWithPdaLinks as any));

        const pdas = result.current?.pdas;
        expect(pdas).toBeDefined();
        expect(pdas?.length).toBe(1);

        // Should have linked the PDA from instructions to program.pdas
        const linkedPda = pdas?.[0];
        expect(linkedPda?.name).toBe('linkedPda');
        expect(linkedPda?.docs).toEqual(['Linked PDA docs']);

        // Should have extracted seeds from the linked PDA
        expect(linkedPda?.seeds.length).toBe(1);
        const seed = linkedPda?.seeds[0] as FieldType;
        expect((seed as any).name).toBe('seed1');
        expect(seed.docs).toEqual(['Seed 1 docs']);
        expect(seed.kind).toBe('type');
    });

    it('should handle different seed types', () => {
        // Create a mock with different seed types
        const mockWithSeedTypes = {
            ...minimalMock,
            program: {
                ...minimalMock.program,
                instructions: [
                    {
                        ...minimalMock.program.instructions[0],
                        accounts: [
                            {
                                defaultValue: {
                                    kind: 'pdaValueNode',
                                    pda: {
                                        kind: 'pdaLinkNode',
                                        name: 'multiSeedPda',
                                    },
                                },
                                docs: [],
                                isOptional: false,
                                isSigner: false,
                                isWritable: true,
                                name: 'pdaAccount',
                            },
                        ],
                    },
                ],
                pdas: [
                    {
                        docs: [],
                        kind: 'pdaNode',
                        name: 'multiSeedPda',
                        seeds: [
                            {
                                docs: ['Variable seed'],
                                kind: 'variablePdaSeedNode',
                                name: 'variableSeed',
                                type: { encoding: 'utf8', kind: 'stringTypeNode' },
                            },
                            {
                                kind: 'constantPdaSeedNode',
                                type: { encoding: 'utf8', kind: 'stringTypeNode' },
                                value: {
                                    kind: 'stringValueNode',
                                    string: 'constant-seed',
                                },
                            },
                            {
                                kind: 'constantPdaSeedNode',
                                type: { kind: 'publicKeyTypeNode' },
                                value: {
                                    kind: 'programIdValueNode',
                                },
                            },
                        ],
                    },
                ],
            },
        };

        const { result } = renderHook(() => useFormatCodamaIdl(mockWithSeedTypes as any));

        const pdas = result.current?.pdas;
        expect(pdas).toBeDefined();
        expect(pdas?.length).toBe(1);

        const multiSeedPda = pdas?.[0];
        expect(multiSeedPda?.seeds.length).toBe(3);

        // Check variable seed
        const variableSeed = multiSeedPda?.seeds[0] as FieldType;
        expect((variableSeed as any).name).toBe('variableSeed');
        expect(variableSeed.docs).toEqual(['Variable seed']);

        // Check constant string seed
        const constantSeed = multiSeedPda?.seeds[1] as FieldType;
        expect((constantSeed as any).name).toBe('constant-seed');
        expect(constantSeed.docs).toEqual([]);

        // Check programId seed
        const programIdSeed = multiSeedPda?.seeds[2] as FieldType;
        expect((programIdSeed as any).name).toBe('programId');
        expect(programIdSeed.docs).toEqual([]);
    });
});

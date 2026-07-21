// The whole naming surface — the standard-agnostic matcher, then one section per standard's table builder.
import {
    bytesTypeNode,
    bytesValueNode,
    constantDiscriminatorNode,
    constantValueNode,
    fieldDiscriminatorNode,
    fixedSizeTypeNode,
    instructionArgumentNode,
    type InstructionArgumentNode,
    instructionNode,
    type InstructionNode,
    numberTypeNode,
    numberValueNode,
    programNode,
    rootNode,
    sizeDiscriminatorNode,
} from 'codama';
import { describe, expect, it } from 'vitest';

import {
    buildInstructionNameResolver,
    buildInstructionNameTable,
    buildProgramName,
    matchInstructionName,
} from '../index';
import type { AnchorIdl, SupportedIdl } from '../../types';
import { incrementIx, loadLetMeBuyIdl, loadSimpleIdl, loadTokenkegIdl, transferIx } from '../../__tests__/fixtures';

describe('matchInstructionName', () => {
    it('should prefer the longest matching prefix', () => {
        const table = [
            { discriminator: Uint8Array.from([1]), name: 'Short', offset: 0 },
            { discriminator: Uint8Array.from([1, 2]), name: 'Long', offset: 0 },
        ];
        expect(matchInstructionName(table, Uint8Array.from([1, 2, 3]))).toBe('Long');
    });

    it('should return undefined when nothing matches', () => {
        const table = [{ discriminator: Uint8Array.from([9]), name: 'Nope', offset: 0 }];
        expect(matchInstructionName(table, Uint8Array.from([1, 2]))).toBeUndefined();
    });

    it('should skip empty discriminators instead of matching everything', () => {
        const table = [{ discriminator: new Uint8Array(), name: 'CatchAll', offset: 0 }];
        expect(matchInstructionName(table, Uint8Array.from([1]))).toBeUndefined();
    });

    it('should reject discriminators longer than the provided data', () => {
        const table = [{ discriminator: Uint8Array.from([1, 2, 3]), name: 'Too Long', offset: 0 }];
        expect(matchInstructionName(table, Uint8Array.from([1, 2]))).toBeUndefined();
    });
});

describe('buildInstructionNameTable fallbacks', () => {
    it('should tolerate runtime Anchor IDLs without an instruction array', () => {
        const idl = { metadata: { spec: '0.1.0' } } as unknown as SupportedIdl;
        expect(buildInstructionNameTable(idl)).toEqual([]);
    });

    it('should tolerate runtime Codama IDLs without an instruction array', () => {
        // publicKey present so detection routes to the codama table — its instruction array is the missing piece
        const idl = {
            kind: 'rootNode',
            program: { publicKey: '11111111111111111111111111111111' },
        } as unknown as SupportedIdl;
        expect(buildInstructionNameTable(idl)).toEqual([]);
    });
});

describe('buildProgramName (Anchor)', () => {
    it('should title-case the metadata name', () => {
        expect(buildProgramName(loadSimpleIdl())).toBe('Simple');
        expect(buildProgramName(loadLetMeBuyIdl())).toBe('Let Me Buy');
    });

    it('should return undefined when the IDL does not name the program', () => {
        const simple = loadSimpleIdl();
        const unnamed = { ...simple, metadata: { ...simple.metadata, name: '' } } as AnchorIdl;
        expect(buildProgramName(unnamed)).toBeUndefined();
    });
});

describe('instruction names (Anchor)', () => {
    it('should build entries from explicit discriminator byte arrays', () => {
        const simple = loadSimpleIdl();
        const table = buildInstructionNameTable(simple);
        expect(table).toHaveLength(simple.instructions.length);
        expect(table).toContainEqual({
            discriminator: Uint8Array.from(incrementIx(simple).data.slice(0, 8)),
            name: 'Increment',
            offset: 0,
        });
    });

    it('should resolve an instruction name from instruction data', () => {
        const simple = loadSimpleIdl();
        const resolve = buildInstructionNameResolver(simple);
        expect(resolve?.(incrementIx(simple).data)).toBe('Increment');
    });

    it('should return undefined when the IDL yields no usable table', () => {
        const noDiscriminators = {
            ...loadSimpleIdl(),
            instructions: [{ accounts: [], args: [], discriminator: [], name: 'bare' }],
        } as AnchorIdl;
        expect(buildInstructionNameResolver(noDiscriminators)).toBeUndefined();
    });

    it('should skip instructions whose members lie about the declared shape', () => {
        const simple = loadSimpleIdl();
        const lying = {
            ...simple,
            instructions: [
                { accounts: [], args: [], discriminator: [1, 2] }, // no name
                { accounts: [], args: [], discriminator: 'nope', name: 'bad_disc' }, // non-array discriminator
                ...simple.instructions,
            ],
        } as unknown as AnchorIdl;
        expect(buildInstructionNameTable(lying)).toHaveLength(simple.instructions.length);
    });
});

describe('buildProgramName (Codama)', () => {
    it('should title-case the program node name', () => {
        expect(buildProgramName(loadTokenkegIdl())).toBe('Token');
    });
});

describe('instruction names (Codama)', () => {
    it('should build entries from constant field discriminators', () => {
        const table = buildInstructionNameTable(loadTokenkegIdl());
        expect(table.length).toBeGreaterThan(1);
        expect(table).toContainEqual({ discriminator: Uint8Array.from([3]), name: 'Transfer', offset: 0 });
    });

    it('should resolve an instruction name from instruction data', () => {
        const tokenkeg = loadTokenkegIdl();
        const resolve = buildInstructionNameResolver(tokenkeg);
        expect(resolve?.(transferIx(tokenkeg).data)).toBe('Transfer');
    });
});

const rootWith = (instruction: InstructionNode) =>
    rootNode(
        programNode({
            instructions: [instruction],
            name: 'probe',
            publicKey: '11111111111111111111111111111111',
            version: '1.0.0',
        }),
    );

const discriminatorArg = (
    type: InstructionArgumentNode['type'],
    defaultValue?: InstructionArgumentNode['defaultValue'],
) => instructionArgumentNode({ defaultValue, defaultValueStrategy: 'omitted', name: 'discriminator', type });

const fieldIx = (type: InstructionArgumentNode['type'], defaultValue?: InstructionArgumentNode['defaultValue']) =>
    instructionNode({
        arguments: [discriminatorArg(type, defaultValue)],
        discriminators: [fieldDiscriminatorNode('discriminator')],
        name: 'probe',
    });

describe('codama discriminator shapes', () => {
    it('should encode multi-byte number discriminators little-endian (u32)', () => {
        const table = buildInstructionNameTable(rootWith(fieldIx(numberTypeNode('u32'), numberValueNode(0x01020304))));
        expect(table).toEqual([{ discriminator: Uint8Array.from([4, 3, 2, 1]), name: 'Probe', offset: 0 }]);
    });

    it('should encode 64-bit number discriminators', () => {
        const table = buildInstructionNameTable(rootWith(fieldIx(numberTypeNode('u64'), numberValueNode(7))));
        expect(table).toEqual([{ discriminator: Uint8Array.from([7, 0, 0, 0, 0, 0, 0, 0]), name: 'Probe', offset: 0 }]);
    });

    it('should decode the byte defaults rootNodeFromAnchor emits (fixed-size base16 bytes)', () => {
        const table = buildInstructionNameTable(
            rootWith(fieldIx(fixedSizeTypeNode(bytesTypeNode(), 8), bytesValueNode('base16', '0b12680968ae3b21'))),
        );
        expect(table).toEqual([
            { discriminator: Uint8Array.from([11, 18, 104, 9, 104, 174, 59, 33]), name: 'Probe', offset: 0 },
        ]);
    });

    it('should build entries from constant discriminator nodes', () => {
        const table = buildInstructionNameTable(
            rootWith(
                instructionNode({
                    discriminators: [
                        constantDiscriminatorNode(constantValueNode(numberTypeNode('u8'), numberValueNode(9))),
                    ],
                    name: 'probe',
                }),
            ),
        );
        expect(table).toEqual([{ discriminator: Uint8Array.from([9]), name: 'Probe', offset: 0 }]);
    });

    it.each([
        [
            'two discriminators',
            instructionNode({
                arguments: [discriminatorArg(numberTypeNode('u8'), numberValueNode(1))],
                discriminators: [fieldDiscriminatorNode('discriminator'), sizeDiscriminatorNode(16)],
                name: 'probe',
            }),
        ],
        [
            'a non-field non-constant node',
            instructionNode({ discriminators: [sizeDiscriminatorNode(8)], name: 'probe' }),
        ],
        [
            'a field at a non-zero offset',
            instructionNode({
                arguments: [discriminatorArg(numberTypeNode('u8'), numberValueNode(1))],
                discriminators: [fieldDiscriminatorNode('discriminator', 1)],
                name: 'probe',
            }),
        ],
        [
            'a constant at a non-zero offset',
            instructionNode({
                discriminators: [
                    constantDiscriminatorNode(constantValueNode(numberTypeNode('u8'), numberValueNode(9)), 1),
                ],
                name: 'probe',
            }),
        ],
        [
            'a field without a matching argument',
            instructionNode({ discriminators: [fieldDiscriminatorNode('nope')], name: 'probe' }),
        ],
        ['an argument without a default value', fieldIx(numberTypeNode('u8'))],
        ['an unsupported number format', fieldIx(numberTypeNode('f32'), numberValueNode(1))],
    ])('should skip unresolvable discriminators: %s', (_shape, instruction) => {
        expect(buildInstructionNameTable(rootWith(instruction))).toEqual([]);
    });

    it('should skip members that lie about the declared shape', () => {
        const lying = {
            kind: 'rootNode',
            program: {
                instructions: [
                    { discriminators: {}, name: 'nonArrayDiscriminators' },
                    { discriminators: [{ kind: 'constantDiscriminatorNode', offset: 0 }], name: 'noConstant' },
                    { discriminators: [{ kind: 'fieldDiscriminatorNode', name: 'd', offset: 0 }], name: 'noArgs' },
                    { discriminators: [{ kind: 'fieldDiscriminatorNode', name: 'd', offset: 0 }] }, // nameless
                ],
                publicKey: '11111111111111111111111111111111',
            },
        } as unknown as SupportedIdl;
        expect(buildInstructionNameTable(lying)).toEqual([]);
    });
});

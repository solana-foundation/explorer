import {
    accountNode,
    arrayTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumEmptyVariantTypeNode,
    enumTypeNode,
    fixedCountNode,
    fixedSizeTypeNode,
    instructionArgumentNode,
    instructionNode,
    mapTypeNode,
    numberTypeNode,
    optionTypeNode,
    programNode,
    publicKeyTypeNode,
    rootNode,
    setTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from 'codama';
import { describe, expect, it } from 'vitest';

import { getDecodedEntries } from '../index';
import { IDL_ERROR__DECODE_KIND_MISMATCH, IdlError, isIdlError } from '../../errors';
import { anchorArm, codamaArm, unknownArm } from '../../types';

// real codama nodes (constructor-built) — the same objects the walk must surface back in entries
const u16 = numberTypeNode('u16');
const u64 = numberTypeNode('u64');
const pubkey = publicKeyTypeNode();
const modeEnum = enumTypeNode([enumEmptyVariantTypeNode('locking'), enumEmptyVariantTypeNode('burning')]);

// exercises every walk rule: link resolution, wrapper penetration, options, arrays, nested structs
const configAccount = accountNode({
    data: structTypeNode([
        structFieldTypeNode({ name: 'authority', type: pubkey }),
        structFieldTypeNode({ name: 'mode', type: definedTypeLinkNode('mode') }),
        structFieldTypeNode({ name: 'chainId', type: definedTypeLinkNode('chainId') }),
        structFieldTypeNode({ name: 'pendingOwner', type: optionTypeNode(pubkey) }),
        structFieldTypeNode({ name: 'delegate', type: optionTypeNode(pubkey) }),
        structFieldTypeNode({ name: 'amount', type: fixedSizeTypeNode(u64, 8) }),
        structFieldTypeNode({ name: 'signers', type: arrayTypeNode(pubkey, fixedCountNode(2)) }),
    ]),
    name: 'config',
});

const transferInstruction = instructionNode({
    arguments: [
        instructionArgumentNode({ name: 'discriminator', type: u16 }),
        instructionArgumentNode({ name: 'amount', type: u64 }),
    ],
    name: 'transfer',
});

const program = programNode({
    accounts: [configAccount],
    definedTypes: [
        definedTypeNode({ name: 'mode', type: modeEnum }),
        definedTypeNode({ name: 'chainId', type: structTypeNode([structFieldTypeNode({ name: 'id', type: u16 })]) }),
    ],
    instructions: [transferInstruction],
    name: 'p',
    publicKey: '11111111111111111111111111111111',
    version: '1.0.0',
});

const root = rootNode(program);

const decodedAccount = {
    data: {
        amount: 42n,
        authority: 'AUTH',
        chainId: { id: 7 },
        delegate: { __option: 'Some', value: 'DELEGATE' },
        mode: 1,
        pendingOwner: { __option: 'None' },
        signers: ['S1', 'S2'],
    },
    path: [root, program, configAccount] as const,
};

describe('getDecodedEntries', () => {
    it('should pair every account leaf with its resolved schema node', () => {
        const entries = getDecodedEntries(codamaArm(decodedAccount));

        expect(entries).toEqual([
            { node: pubkey, path: ['authority'], value: 'AUTH' },
            { node: modeEnum, path: ['mode'], value: 1 },
            { node: u16, path: ['chainId', 'id'], value: 7 },
            { node: optionTypeNode(pubkey), path: ['pendingOwner'], value: undefined },
            { node: pubkey, path: ['delegate'], value: 'DELEGATE' },
            { node: u64, path: ['amount'], value: 42n },
            { node: pubkey, path: ['signers', 0], value: 'S1' },
            { node: pubkey, path: ['signers', 1], value: 'S2' },
        ]);
    });

    it('should walk instruction arguments with the argument name as the path root', () => {
        const decodedInstruction = {
            accounts: [],
            data: { amount: 42n, discriminator: 3 },
            path: [root, program, transferInstruction] as const,
        };

        const entries = getDecodedEntries(codamaArm(decodedInstruction));

        expect(entries).toEqual([
            { node: u16, path: ['discriminator'], value: 3 },
            { node: u64, path: ['amount'], value: 42n },
        ]);
    });

    it('should walk tuples, maps, and sets with indices and keys as path segments', () => {
        const containersAccount = accountNode({
            data: structTypeNode([
                structFieldTypeNode({ name: 'pair', type: tupleTypeNode([u16, pubkey]) }),
                structFieldTypeNode({
                    name: 'fees',
                    type: mapTypeNode(stringTypeNode('utf8'), u64, fixedCountNode(2)),
                }),
                structFieldTypeNode({ name: 'flags', type: setTypeNode(u16, fixedCountNode(2)) }),
            ]),
            name: 'containers',
        });
        const decode = codamaArm({
            // maps decode to plain objects and sets to plain arrays — the codec inputs, not Map/Set instances
            data: { fees: { base: 10n, tip: 2n }, flags: [7, 9], pair: [3, 'KEY'] },
            path: [root, program, containersAccount] as const,
        });

        expect(getDecodedEntries(decode)).toEqual([
            { node: u16, path: ['pair', 0], value: 3 },
            { node: pubkey, path: ['pair', 1], value: 'KEY' },
            { node: u64, path: ['fees', 'base'], value: 10n },
            { node: u64, path: ['fees', 'tip'], value: 2n },
            { node: u16, path: ['flags', 0], value: 7 },
            { node: u16, path: ['flags', 1], value: 9 },
        ]);
    });

    it('should keep container values contradicting their schema as leaves instead of dropping them', () => {
        const clashAccount = accountNode({
            data: structTypeNode([
                structFieldTypeNode({ name: 'list', type: arrayTypeNode(u16, fixedCountNode(2)) }),
                structFieldTypeNode({
                    name: 'lookup',
                    type: mapTypeNode(stringTypeNode('utf8'), u16, fixedCountNode(1)),
                }),
                structFieldTypeNode({ name: 'pair', type: tupleTypeNode([u16]) }),
            ]),
            name: 'clash',
        });
        const decode = codamaArm({
            // pair is not indexable at all — its items become undefined-valued leaves
            data: { list: 'not-an-array', lookup: 42, pair: 9 },
            path: [root, program, clashAccount] as const,
        });

        expect(getDecodedEntries(decode)).toEqual([
            { node: arrayTypeNode(u16, fixedCountNode(2)), path: ['list'], value: 'not-an-array' },
            { node: mapTypeNode(stringTypeNode('utf8'), u16, fixedCountNode(1)), path: ['lookup'], value: 42 },
            { node: u16, path: ['pair', 0], value: undefined },
        ]);
    });

    it('should keep an unresolvable defined-type link as a leaf instead of dropping it', () => {
        const orphanAccount = accountNode({
            data: structTypeNode([structFieldTypeNode({ name: 'ghost', type: definedTypeLinkNode('gone') })]),
            name: 'orphan',
        });
        const decode = codamaArm({ data: { ghost: 5 }, path: [root, program, orphanAccount] as const });

        expect(getDecodedEntries(decode)).toEqual([{ node: definedTypeLinkNode('gone'), path: ['ghost'], value: 5 }]);
    });

    it('should throw the typed kind-mismatch error for the unknown and anchor arms', () => {
        expect(() => getDecodedEntries(unknownArm([]))).toThrowError(IdlError);
        expect(() => getDecodedEntries(anchorArm({ amount: 1n }))).toThrowError(IdlError);
        try {
            getDecodedEntries(unknownArm([]));
        } catch (error) {
            expect(isIdlError(error, IDL_ERROR__DECODE_KIND_MISMATCH)).toBe(true);
        }
    });
});

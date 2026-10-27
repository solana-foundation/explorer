import { type ParsedInstruction, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { instructionDataOf, toInstructionNode, toRawInstructionNode } from '../model/node';

const PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

const RAW = new TransactionInstruction({ data: Buffer.from([1]), keys: [], programId: PROGRAM_ID });
const PARSED: ParsedInstruction = {
    parsed: { type: 'create' },
    program: 'spl-associated-token-account',
    programId: PROGRAM_ID,
};
const SYSTEM_RAW = new TransactionInstruction({ data: Buffer.from([1]), keys: [], programId: SystemProgram.programId });

describe('toInstructionNode', () => {
    it.each([
        ['TransactionInstruction', RAW],
        ['ParsedInstruction', PARSED],
    ])('should take the program id from a %s', (_, ix) => {
        expect(toInstructionNode({ index: 0, ix }).programId).toBe(PROGRAM_ID);
    });

    it.each([
        ['raw', { raw: SYSTEM_RAW }],
        ['a passed programId', { programId: SystemProgram.programId }],
    ])('should take the program id from ix, not from %s', (_, other) => {
        const fields = { index: 0, ix: PARSED, ...other };

        expect(toInstructionNode(fields).programId).toBe(PROGRAM_ID);
    });

    it('should keep the fields it is given', () => {
        const children = [toInstructionNode({ childIndex: 0, index: 1, ix: RAW }), undefined];

        expect(toInstructionNode({ childIndex: 2, children, index: 1, ix: PARSED, raw: RAW })).toEqual({
            childIndex: 2,
            children,
            index: 1,
            ix: PARSED,
            programId: PROGRAM_ID,
            raw: RAW,
        });
    });
});

describe('toRawInstructionNode', () => {
    it.each([
        ['raw', { raw: SYSTEM_RAW }],
        ['a passed programId', { programId: SystemProgram.programId }],
    ])('should take the program id and the raw instruction from ix, not from %s', (_, other) => {
        const fields = { index: 0, ix: RAW, ...other };

        const node = toRawInstructionNode(fields);

        expect(node.programId).toBe(PROGRAM_ID);
        expect(node.raw).toBe(RAW);
    });

    it('should keep the fields it is given', () => {
        const children = [toInstructionNode({ childIndex: 0, index: 1, ix: RAW }), undefined];

        expect(toRawInstructionNode({ childIndex: 2, children, index: 1, ix: RAW })).toEqual({
            childIndex: 2,
            children,
            index: 1,
            ix: RAW,
            programId: PROGRAM_ID,
            raw: RAW,
        });
    });
});

describe('instructionDataOf', () => {
    const nodes = [toInstructionNode({ index: 0, ix: RAW }), toInstructionNode({ index: 1, ix: PARSED }), undefined];

    it.each([
        ['an instruction in byte form', 0, RAW.data],
        ['an RPC-parsed instruction', 1, undefined],
        ['an instruction the page cannot resolve', 2, undefined],
        ['an index past the last instruction', 3, undefined],
    ])('should read the data of %s', (_, index, data) => {
        expect(instructionDataOf(nodes)(index)).toEqual(data);
    });
});

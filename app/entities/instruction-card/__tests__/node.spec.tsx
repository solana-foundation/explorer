import { type ParsedInstruction, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { toInstructionNode } from '../model/node';

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
        const innerCards = [<div key="inner" />];

        expect(toInstructionNode({ childIndex: 2, index: 1, innerCards, ix: PARSED, raw: RAW })).toEqual({
            childIndex: 2,
            index: 1,
            innerCards,
            ix: PARSED,
            programId: PROGRAM_ID,
            raw: RAW,
        });
    });
});

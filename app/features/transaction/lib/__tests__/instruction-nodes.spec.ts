import { gen } from '@__fixtures__/gen';
import { getBase58Decoder } from '@solana/kit';
import {
    type ParsedInstruction,
    type ParsedTransaction,
    type PartiallyDecodedInstruction,
    PublicKey,
    SystemProgram,
    TransactionInstruction,
} from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { toInstructionNodes } from '../instruction-nodes';

const BASE58_DECODER = getBase58Decoder();
const PAYER = gen.publicKey(0);
const PROGRAM = gen.publicKey(1);
const UNLISTED = gen.publicKey(2);

const PARSED: ParsedInstruction = {
    parsed: { info: {}, type: 'transfer' },
    program: 'system',
    programId: SystemProgram.programId,
};

describe('toInstructionNodes', () => {
    it('should keep an RPC-parsed instruction as it is', () => {
        const [node] = toInstructionNodes(transaction([PARSED]), undefined);

        expect(node).toEqual({ children: undefined, index: 0, ix: PARSED, programId: SystemProgram.programId });
    });

    it('should convert a partially decoded instruction to its byte form', () => {
        const [node] = toInstructionNodes(transaction([partiallyDecoded([PAYER], [7, 8])]), undefined);

        expect(node?.ix).toBeInstanceOf(TransactionInstruction);
        expect(node?.ix).toMatchObject({
            data: Buffer.from([7, 8]),
            keys: [{ isSigner: true, isWritable: true, pubkey: PAYER }],
            programId: PROGRAM,
        });
    });

    it('should mark an instruction that names an account the message does not list', () => {
        expect(toInstructionNodes(transaction([partiallyDecoded([UNLISTED])]), undefined)).toEqual([undefined]);
    });

    it('should give each instruction the CPIs of its index, in order, across groups, past one it cannot resolve', () => {
        const nodes = toInstructionNodes(transaction([PARSED, PARSED]), [
            { index: 1, instructions: [partiallyDecoded([PAYER], [1])] },
            { index: 1, instructions: [partiallyDecoded([UNLISTED]), PARSED] },
        ]);

        expect(nodes[0]?.children).toBeUndefined();
        expect(nodes[1]?.children?.map(child => child && [child.index, child.childIndex])).toEqual([
            [1, 0],
            undefined,
            [1, 2],
        ]);
        expect(nodes[1]?.children?.[2]?.ix).toBe(PARSED);
    });
});

function partiallyDecoded(accounts: PublicKey[], data: number[] = []): PartiallyDecodedInstruction {
    return { accounts, data: BASE58_DECODER.decode(new Uint8Array(data)), programId: PROGRAM };
}

function transaction(instructions: (ParsedInstruction | PartiallyDecodedInstruction)[]): ParsedTransaction {
    return {
        message: {
            accountKeys: [{ pubkey: PAYER, signer: true, source: 'transaction', writable: true }],
            instructions,
            recentBlockhash: PublicKey.default.toBase58(),
        },
        signatures: [],
    };
}

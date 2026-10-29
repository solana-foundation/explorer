import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it, vi } from 'vitest';

import { type InstructionNode, toInstructionNode } from '../model/node';
import { type RawInstructions, rawSourceOf } from '../model/raw-source';

const PROGRAM_ID = PublicKey.default;
const PARSED_IX = { parsed: { info: {}, type: 'transfer' }, program: 'system', programId: PROGRAM_ID };
const WIRE_IX = new TransactionInstruction({ data: Buffer.from([1]), keys: [], programId: PROGRAM_ID });

describe('rawSourceOf', () => {
    it('should show the raw form the node carries, without a fetch', () => {
        const fetch = vi.fn();

        expect(rawSourceOf(node({ raw: WIRE_IX }), { fetch, status: 'fetchable' })).toEqual({
            ix: WIRE_IX,
            kind: 'instruction',
        });
    });

    it('should show nothing on a page with no transaction to fetch', () => {
        expect(rawSourceOf(node(), undefined)).toEqual({ kind: 'none' });
    });

    it.each([
        ['a top-level instruction', node()],
        ['an inner instruction', node({ childIndex: 0 })],
    ])('should offer a fetch for %s before the transaction arrives', (_, ixNode) => {
        const fetch = vi.fn();

        expect(rawSourceOf(ixNode, { fetch, status: 'fetchable' })).toEqual({ fetch, kind: 'fetchable' });
    });

    it('should show the fetched instruction at the position of a top-level node', () => {
        const other = new TransactionInstruction({ data: Buffer.from([2]), keys: [], programId: PROGRAM_ID });

        expect(rawSourceOf(node({ index: 1 }), fetched([other, WIRE_IX]))).toEqual({
            ix: WIRE_IX,
            kind: 'instruction',
        });
    });

    it('should say the raw form is unavailable when the fetched transaction cannot be decompiled', () => {
        expect(rawSourceOf(node(), fetched(undefined))).toEqual({ kind: 'unavailable' });
    });

    it('should show nothing for an inner instruction once the transaction arrives', () => {
        expect(rawSourceOf(node({ childIndex: 0 }), fetched([WIRE_IX]))).toEqual({ kind: 'none' });
    });
});

function node(fields: Partial<Pick<InstructionNode, 'childIndex' | 'index' | 'raw'>> = {}): InstructionNode {
    return toInstructionNode({ index: 0, ix: PARSED_IX, ...fields });
}

function fetched(instructions: TransactionInstruction[] | undefined): RawInstructions {
    return { instructions, status: 'fetched' };
}

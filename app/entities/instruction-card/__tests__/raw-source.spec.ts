import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it, vi } from 'vitest';

import { type InstructionNode, toInstructionNode } from '../model/node';
import { parsedInstructionOf, type RawInstructions, rawSourceOf } from '../model/raw-source';

const PROGRAM_ID = PublicKey.default;
const PARSED_IX = { parsed: { info: {}, type: 'transfer' }, program: 'system', programId: PROGRAM_ID };
const WIRE_IX = new TransactionInstruction({ data: Buffer.from([1]), keys: [], programId: PROGRAM_ID });
const OTHER_PROGRAM_IX = new TransactionInstruction({
    data: Buffer.from([1]),
    keys: [],
    programId: new PublicKey('11111111111111111111111111111112'),
});

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

    it('should offer a retry after the fetch fails', () => {
        const fetch = vi.fn();

        expect(rawSourceOf(node(), { fetch, status: 'failed' })).toEqual({ fetch, kind: 'failed' });
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

    it('should show the fetched inner instruction at the position of an inner node', () => {
        const inner = new Map([[1, [undefined, WIRE_IX]]]);

        expect(rawSourceOf(node({ childIndex: 1, index: 1 }), fetched([], inner))).toEqual({
            ix: WIRE_IX,
            kind: 'instruction',
        });
    });

    it('should say the raw form is unavailable when the inner instructions cannot be resolved', () => {
        expect(rawSourceOf(node({ childIndex: 0 }), fetched([WIRE_IX]))).toEqual({ kind: 'unavailable' });
    });

    it.each([
        ['a top-level node', node(), fetched([OTHER_PROGRAM_IX])],
        ['an inner node', node({ childIndex: 0 }), fetched([], new Map([[0, [OTHER_PROGRAM_IX]]]))],
    ])(
        'should say the raw form is unavailable when the raw instruction of %s calls another program',
        (_, ixNode, raw) => {
            expect(rawSourceOf(ixNode, raw)).toEqual({ kind: 'unavailable' });
        },
    );
});

describe('parsedInstructionOf', () => {
    it('should take an unparsed node as its own full form', () => {
        const unparsed = toInstructionNode({ index: 0, ix: WIRE_IX });

        expect(parsedInstructionOf(unparsed, { kind: 'none' })).toBe(WIRE_IX);
    });

    it('should take the raw instruction of a parsed node', () => {
        expect(parsedInstructionOf(node(), { ix: WIRE_IX, kind: 'instruction' })).toBe(WIRE_IX);
    });

    it.each([
        ['before the raw transaction arrives', { fetch: vi.fn(), kind: 'fetchable' as const }],
        ['after the raw fetch fails', { fetch: vi.fn(), kind: 'failed' as const }],
        ['when the raw form is unavailable', { kind: 'unavailable' as const }],
    ])('should have no full form for a parsed node %s', (_, rawSource) => {
        expect(parsedInstructionOf(node(), rawSource)).toBeUndefined();
    });
});

function node(fields: Partial<Pick<InstructionNode, 'childIndex' | 'index' | 'raw'>> = {}): InstructionNode {
    return toInstructionNode({ index: 0, ix: PARSED_IX, ...fields });
}

function fetched(
    instructions: TransactionInstruction[] | undefined,
    innerInstructions?: Map<number, (TransactionInstruction | undefined)[]>,
): RawInstructions {
    return { innerInstructions, instructions, status: 'fetched' };
}

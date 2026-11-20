import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it, vi } from 'vitest';

import { createInstructionParserDispatcher, isParsedBy, isParsedInstruction } from '../dispatcher.js';
import type { InstructionParser, ParsedInstructionInfo } from '../dispatcher.js';
import { gen } from './gen.js';

const PROGRAM_ID = gen.tokenProgram;
const OTHER_PROGRAM_ID = gen.systemProgram;

function makeParser(overrides: Partial<InstructionParser> = {}): InstructionParser {
    return {
        fromTransaction: vi.fn().mockReturnValue({ info: { amount: 1 }, type: 'transfer' }),
        programId: PROGRAM_ID,
        programLabel: 'spl-token',
        ...overrides,
    };
}

function makeTransactionInstruction(programId: string = PROGRAM_ID): TransactionInstruction {
    return new TransactionInstruction({
        data: Buffer.from([3, 0]),
        keys: [{ isSigner: true, isWritable: true, pubkey: new PublicKey(OTHER_PROGRAM_ID) }],
        programId: new PublicKey(programId),
    });
}

function makeRpcParsedInstruction(program = 'spl-token', programId: string = PROGRAM_ID) {
    return {
        parsed: { info: { source: 'abc' }, type: 'transfer' },
        program,
        programId: new PublicKey(programId),
    };
}

describe('createInstructionParserDispatcher', () => {
    it('should throw on duplicate programId registration', () => {
        expect(() => createInstructionParserDispatcher([makeParser(), makeParser()])).toThrow('duplicate parser for');
    });

    it('should report registration through canHandle', () => {
        const dispatcher = createInstructionParserDispatcher([makeParser()]);

        expect(dispatcher.canHandle(PROGRAM_ID)).toBe(true);
        expect(dispatcher.canHandle(OTHER_PROGRAM_ID)).toBe(false);
    });

    it('should expose registered parsers through getInstructionParser', () => {
        const parser = makeParser();
        const dispatcher = createInstructionParserDispatcher([parser]);

        expect(dispatcher.getInstructionParser(PROGRAM_ID)).toBe(parser);
        expect(dispatcher.getInstructionParser(OTHER_PROGRAM_ID)).toBeUndefined();
    });

    it('should return undefined from the byte path when no parser is registered', () => {
        const dispatcher = createInstructionParserDispatcher([]);

        expect(dispatcher.fromTransactionInstruction(makeTransactionInstruction())).toBeUndefined();
    });

    it('should tag byte-path slice output with the parser that produced it', () => {
        const parser = makeParser();
        const dispatcher = createInstructionParserDispatcher([parser]);

        const result = dispatcher.fromTransactionInstruction(makeTransactionInstruction());

        expect(result).toEqual({
            parsed: { info: { amount: 1 }, type: 'transfer' },
            parser,
            program: 'spl-token',
            programId: new PublicKey(PROGRAM_ID),
        });
    });

    it('should convert to a kit instruction once at the byte-path entry', () => {
        const fromTransaction = vi.fn().mockReturnValue(undefined);
        const dispatcher = createInstructionParserDispatcher([makeParser({ fromTransaction })]);

        dispatcher.fromTransactionInstruction(makeTransactionInstruction());

        expect(fromTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                accounts: [expect.objectContaining({ address: OTHER_PROGRAM_ID })],
                programAddress: PROGRAM_ID,
            }),
        );
    });

    it('should mark a registered parser that rejects the bytes as UnparsedInstruction', () => {
        const dispatcher = createInstructionParserDispatcher([
            makeParser({ fromTransaction: vi.fn().mockReturnValue(undefined) }),
        ]);

        expect(dispatcher.fromTransactionInstruction(makeTransactionInstruction())).toEqual({
            programId: new PublicKey(PROGRAM_ID),
            programLabel: 'spl-token',
            unknown: true,
        });
    });

    it('should pass RPC-parsed instructions through unchanged when no parser is registered', () => {
        const dispatcher = createInstructionParserDispatcher([]);
        const ix = makeRpcParsedInstruction() as never;

        expect(dispatcher.fromParsedInstruction(ix)).toBe(ix);
    });

    it('should pass RPC-parsed instructions through when the parser has no fromParsed', () => {
        const dispatcher = createInstructionParserDispatcher([makeParser()]);
        const ix = makeRpcParsedInstruction() as never;

        expect(dispatcher.fromParsedInstruction(ix)).toBe(ix);
    });

    it('should fall back to the RPC view when the slice rejects the parsed input', () => {
        const fromParsed = vi.fn().mockReturnValue(undefined);
        const dispatcher = createInstructionParserDispatcher([makeParser({ fromParsed })]);
        const ix = makeRpcParsedInstruction() as never;

        expect(dispatcher.fromParsedInstruction(ix)).toBe(ix);
        expect(fromParsed).toHaveBeenCalled();
    });

    it('should normalize RPC-parsed input through the slice fromParsed', () => {
        const sliceParsed: ParsedInstructionInfo = { info: { normalized: true }, type: 'transfer' };
        const parser = makeParser({ fromParsed: vi.fn().mockReturnValue(sliceParsed) });
        const dispatcher = createInstructionParserDispatcher([parser]);

        const result = dispatcher.fromParsedInstruction(makeRpcParsedInstruction() as never);

        expect(result).toEqual({
            parsed: { info: { normalized: true }, type: 'transfer' },
            parser,
            program: 'spl-token',
            programId: new PublicKey(PROGRAM_ID),
        });
    });
});

describe('isParsedBy', () => {
    const parser = makeParser();
    const otherParser = makeParser({ programId: OTHER_PROGRAM_ID });
    const dispatcher = createInstructionParserDispatcher([parser, otherParser]);

    it('should accept output that one of the given parsers produced', () => {
        const result = dispatcher.fromTransactionInstruction(makeTransactionInstruction());

        expect(isParsedBy(result, [otherParser, parser])).toBe(true);
    });

    it('should reject results that none of the given parsers produced', () => {
        const results = [
            makeRpcParsedInstruction() as never,
            dispatcher.fromTransactionInstruction(makeTransactionInstruction(OTHER_PROGRAM_ID)),
            { programId: new PublicKey(PROGRAM_ID), programLabel: 'spl-token' as const, unknown: true as const },
            undefined,
        ];

        expect(results.map(result => isParsedBy(result, [parser]))).toEqual([false, false, false, false]);
    });
});

describe('isParsedInstruction', () => {
    const pubkey = new PublicKey(PROGRAM_ID);

    it('should reject undefined dispatch results', () => {
        expect(isParsedInstruction(undefined)).toBe(false);
    });

    it('should reject UnparsedInstruction results', () => {
        expect(isParsedInstruction({ programId: pubkey, programLabel: 'spl-token', unknown: true })).toBe(false);
    });

    it('should accept canonical ParsedInstruction results', () => {
        expect(
            isParsedInstruction({ parsed: { info: {}, type: 'transfer' }, program: 'spl-token', programId: pubkey }),
        ).toBe(true);
    });
});

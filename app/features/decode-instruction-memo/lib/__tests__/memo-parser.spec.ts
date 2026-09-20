import { createInstructionParserDispatcher, isParsedInstruction } from '@entities/instruction-parser';
import { getUtf8Encoder } from '@solana/kit';
import { type ParsedInstruction, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { memoInstructionParsers } from '../memo-client';
import {
    isMemoParsed,
    MEMO_PROGRAM_LABEL,
    parseMemoInstruction,
    parseMemoRpcInstruction,
    SUPPORTED_MEMO_PROGRAM_ADDRESSES,
} from '../memo-parser';

const [MEMO_V1, MEMO_V3, MEMO_V4] = SUPPORTED_MEMO_PROGRAM_ADDRESSES;

const dispatcher = createInstructionParserDispatcher(memoInstructionParsers);

describe('parseMemoInstruction', () => {
    it('should decode the instruction data as UTF-8', () => {
        const data = new Uint8Array(getUtf8Encoder().encode('gm ☀️'));

        expect(parseMemoInstruction({ accounts: [], data, programAddress: MEMO_V3 })).toEqual({
            info: 'gm ☀️',
            type: 'memo',
        });
    });
});

describe('parseMemoRpcInstruction', () => {
    it('should lift the bare RPC string into the slice envelope', () => {
        expect(parseMemoRpcInstruction(rpcMemo('gm'))).toEqual({ info: 'gm', type: 'memo' });
    });

    it('should reject a non-string payload', () => {
        expect(parseMemoRpcInstruction({ ...rpcMemo('gm'), parsed: { info: {}, type: 'memo' } })).toBeUndefined();
    });

    it('should reject another program', () => {
        expect(parseMemoRpcInstruction({ ...rpcMemo('gm'), program: 'spl-token' })).toBeUndefined();
    });
});

describe('memoInstructionParsers', () => {
    it.each([MEMO_V1, MEMO_V3, MEMO_V4])('should decode bytes sent to %s', programId => {
        const dispatched = dispatcher.fromTransactionInstruction(
            new TransactionInstruction({
                data: Buffer.from('hello'),
                keys: [],
                programId: new PublicKey(programId),
            }),
        );

        expect(isParsedInstruction(dispatched)).toBe(true);
        expect(dispatched && 'parsed' in dispatched && dispatched.parsed).toEqual({ info: 'hello', type: 'memo' });
        expect(dispatched?.programId.toBase58()).toBe(programId);
    });

    it('should normalise the RPC view into the same shape as the byte path', () => {
        const parsed = dispatcher.fromParsedInstruction(rpcMemo('hello')).parsed;

        expect(isMemoParsed(parsed)).toBe(true);
        expect(parsed).toEqual({ info: 'hello', type: 'memo' });
    });
});

function rpcMemo(memo: string): ParsedInstruction {
    return { parsed: memo, program: MEMO_PROGRAM_LABEL, programId: new PublicKey(MEMO_V3) };
}

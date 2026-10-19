import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { WORMHOLE_PROGRAM_IDS } from '@explorer/decoder-wormhole';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { wormholeInstructionParsers } from '../lib/wormhole-client';
import { WORMHOLE_PROGRAM_LABEL } from '../lib/wormhole-parser';

vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn() } }));

const dispatcher = createInstructionParserDispatcher(wormholeInstructionParsers);

describe('parseWormholeInstruction', () => {
    beforeEach(() => {
        vi.mocked(Logger.error).mockClear();
    });

    it('should resolve a known tag to its name', () => {
        expect(dispatcher.fromTransactionInstruction(makeInstruction([2]))).toMatchObject({
            parsed: { info: {}, type: 'Post VAA' },
            program: WORMHOLE_PROGRAM_LABEL,
        });
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should leave a tag outside the name table unparsed and report it', () => {
        expect(dispatcher.fromTransactionInstruction(makeInstruction([255]))).toMatchObject({
            programLabel: WORMHOLE_PROGRAM_LABEL,
            unknown: true,
        });
        // A tag outside the name table means the vendored table is stale.
        expect(Logger.error).toHaveBeenCalledOnce();
    });
});

function makeInstruction(data: number[]): TransactionInstruction {
    return new TransactionInstruction({
        data: Buffer.from(data),
        keys: [],
        programId: new PublicKey(WORMHOLE_PROGRAM_IDS[0]),
    });
}

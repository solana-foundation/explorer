import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { GENESIS_PROGRAM_ADDRESS } from '../constants';
import { genesisInstructionParser } from '../genesis-client';
import { GENESIS_PROGRAM_LABEL } from '../genesis-parser';

vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn() } }));

const dispatcher = createInstructionParserDispatcher([genesisInstructionParser]);
// Shank's positional number for EmitEvent; the program uses 255, so 130 is unused.
const UNKNOWN_DISCRIMINATOR = 130;

describe('parseGenesisInstruction', () => {
    beforeEach(() => {
        vi.mocked(Logger.error).mockClear();
    });

    it('should name a Genesis instruction through the dispatcher', () => {
        // The names themselves are covered by the genesis entity's resolver spec; this checks the wiring.
        expect(dispatcher.fromTransactionInstruction(makeInstruction([116, 1, 2]))).toMatchObject({
            parsed: { info: {}, type: 'ClaimClaimScheduleV2' },
            program: GENESIS_PROGRAM_LABEL,
        });
    });

    it('should leave an unknown discriminator unparsed and report it', () => {
        expect(dispatcher.fromTransactionInstruction(makeInstruction([UNKNOWN_DISCRIMINATOR]))).toMatchObject({
            programLabel: GENESIS_PROGRAM_LABEL,
            unknown: true,
        });
        expect(Logger.error).toHaveBeenCalledOnce();
    });

    it('should leave empty data unparsed without reporting it', () => {
        expect(dispatcher.fromTransactionInstruction(makeInstruction([]))).toMatchObject({ unknown: true });
        expect(Logger.error).not.toHaveBeenCalled();
    });
});

function makeInstruction(data: number[]): TransactionInstruction {
    return new TransactionInstruction({
        data: Buffer.from(data),
        keys: [],
        programId: new PublicKey(GENESIS_PROGRAM_ADDRESS),
    });
}

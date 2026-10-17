import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { TOKEN_SWAP_PROGRAM_IDS } from '@explorer/decoder-token-swap';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { tokenSwapInstructionParsers } from '../lib/token-swap-client';
import { TOKEN_SWAP_PROGRAM_LABEL } from '../lib/token-swap-parser';

vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn() } }));

const dispatcher = createInstructionParserDispatcher(tokenSwapInstructionParsers);

describe('parseTokenSwapInstruction', () => {
    beforeEach(() => {
        vi.mocked(Logger.error).mockClear();
    });

    it('should resolve a known tag to its name', () => {
        expect(dispatcher.fromTransactionInstruction(makeInstruction([1]))).toMatchObject({
            parsed: { info: {}, type: 'Swap' },
            program: TOKEN_SWAP_PROGRAM_LABEL,
        });
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should leave a tag outside the name table unparsed and report it', () => {
        expect(dispatcher.fromTransactionInstruction(makeInstruction([255]))).toMatchObject({
            programLabel: TOKEN_SWAP_PROGRAM_LABEL,
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
        programId: new PublicKey(TOKEN_SWAP_PROGRAM_IDS[0]),
    });
}

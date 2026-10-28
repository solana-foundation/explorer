import { makeInstruction } from '@__fixtures__/instruction';
import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { TOKEN_SWAP_PROGRAM_IDS } from '@explorer/decoder-token-swap';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { tokenSwapInstructionParsers } from '../lib/token-swap-client';
import { TOKEN_SWAP_PROGRAM_LABEL } from '../lib/token-swap-parser';

const dispatcher = createInstructionParserDispatcher(tokenSwapInstructionParsers);
const makeIx = (data: number[]) => makeInstruction({ data, programId: TOKEN_SWAP_PROGRAM_IDS[0] });

describe('parseTokenSwapInstruction', () => {
    beforeEach(() => {
        vi.mocked(Logger.error).mockClear();
    });

    it('should resolve a known tag to its name', () => {
        expect(dispatcher.fromTransactionInstruction(makeIx([1]))).toMatchObject({
            parsed: { info: {}, type: 'Swap' },
            program: TOKEN_SWAP_PROGRAM_LABEL,
        });
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should leave a tag outside the name table unparsed and report it', () => {
        expect(dispatcher.fromTransactionInstruction(makeIx([255]))).toMatchObject({
            programLabel: TOKEN_SWAP_PROGRAM_LABEL,
            unknown: true,
        });
        // A tag outside the name table means the vendored table is stale.
        expect(Logger.error).toHaveBeenCalledOnce();
    });
});

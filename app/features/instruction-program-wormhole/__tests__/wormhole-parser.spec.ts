import { makeInstruction } from '@__fixtures__/instruction';
import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { WORMHOLE_PROGRAM_IDS } from '@explorer/decoder-wormhole';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { wormholeInstructionParsers } from '../lib/wormhole-client';
import { WORMHOLE_PROGRAM_LABEL } from '../lib/wormhole-parser';

const dispatcher = createInstructionParserDispatcher(wormholeInstructionParsers);
const makeIx = (data: number[]) => makeInstruction({ data, programId: WORMHOLE_PROGRAM_IDS[0] });

describe('parseWormholeInstruction', () => {
    beforeEach(() => {
        vi.mocked(Logger.error).mockClear();
    });

    it('should resolve a known tag to its name', () => {
        expect(dispatcher.fromTransactionInstruction(makeIx([2]))).toMatchObject({
            parsed: { info: {}, type: 'Post VAA' },
            program: WORMHOLE_PROGRAM_LABEL,
        });
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should leave a tag outside the name table unparsed and report it', () => {
        expect(dispatcher.fromTransactionInstruction(makeIx([255]))).toMatchObject({
            programLabel: WORMHOLE_PROGRAM_LABEL,
            unknown: true,
        });
        // A tag outside the name table means the vendored table is stale.
        expect(Logger.error).toHaveBeenCalledOnce();
    });
});

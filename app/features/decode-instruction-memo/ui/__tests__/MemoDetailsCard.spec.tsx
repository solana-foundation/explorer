import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { type ParsedInstruction, PublicKey } from '@solana/web3.js';
import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { readCardRows, renderTxCard } from '@/app/__tests__/card-harness';

import { memoInstructionParsers } from '../../lib/memo-client';
import { MemoDetailsCard } from '../MemoDetailsCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

const dispatcher = createInstructionParserDispatcher(memoInstructionParsers);

describe('MemoDetailsCard', () => {
    it('should render the memo payload and the program row', async () => {
        renderCard(memoInstruction('gm'));

        await waitFor(() => {
            expect(readCardRows()).toEqual([
                ['Program', MEMO_PROGRAM_ID.toBase58()],
                ['Data (UTF-8)', 'gm'],
            ]);
        });

        expect(screen.getByText('Memo Program: Memo')).toBeInTheDocument();
    });

    // A memo is free-form text of any length, so the card breaks it rather than letting it stretch the row.
    it('should break a memo longer than a line', async () => {
        const memo = 'a'.repeat(120);

        renderCard(memoInstruction(memo));

        await waitFor(() => {
            expect(readCardRows()[1]).toEqual([
                'Data (UTF-8)',
                ['a'.repeat(50), 'a'.repeat(50), 'a'.repeat(20)].join('\n'),
            ]);
        });
    });

    // Every deployment is registered, so the v1 program reaches the same card and names its own program.
    it('should render the program row from the node', async () => {
        const legacyMemoProgram = new PublicKey('Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo');

        renderCard({ ...memoInstruction('gm'), programId: legacyMemoProgram });

        await waitFor(() => {
            expect(readCardRows()).toEqual([
                ['Program', legacyMemoProgram.toBase58()],
                ['Data (UTF-8)', 'gm'],
            ]);
        });
    });

    // A payload the slice did not normalise must not reach `wrap` as a non-string.
    it('should fall back to the unknown card when the payload is not a memo', async () => {
        renderCard({ parsed: { info: {}, type: 'other' }, program: 'spl-memo', programId: MEMO_PROGRAM_ID });

        await waitFor(() => {
            expect(screen.getByText('Memo Program: Unknown Instruction')).toBeInTheDocument();
        });
    });
});

function memoInstruction(memo: string): ParsedInstruction {
    return { parsed: memo, program: 'spl-memo', programId: MEMO_PROGRAM_ID };
}

function renderCard(ix: ParsedInstruction) {
    return renderTxCard(<MemoDetailsCard ix={dispatcher.fromParsedInstruction(ix)} index={0} />);
}

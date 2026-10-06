/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import {
    createInstructionParserDispatcher,
    isParsedInstruction,
    toParsedTransaction,
} from '@entities/instruction-parser';
import { tokenInstructionParser } from '@features/decode-instruction-token';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

import { renderWithProviders } from '@/app/__tests__/card-harness';
import * as stubs from '@/app/__tests__/mock-stubs';
import { decompileStubInstruction } from '@/app/__tests__/mocks';

import { InspectorInstructionCard } from '../../common/InspectorInstructionCard';
import { TokenDetailsCard } from '../token/TokenDetailsCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

const dispatcher = createInstructionParserDispatcher([tokenInstructionParser]);

describe('instruction::TokenDetailsCard', () => {
    beforeEach(() => {
        // shouldAdvanceTime keeps waitFor's polling alive while the original setTimeout fix stays in place
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test.each([
        { index: 3, stub: stubs.tokenTransferMsg, title: /Token Program: Transfer/ },
        { index: 1, stub: stubs.tokenTransferCheckedMsg, title: /Token Program: Transfer \(Checked\)/ },
    ])('should render $title', async ({ index, stub, title }) => {
        const { instruction, message } = decompileStubInstruction(stub, index, { programId: TOKEN_PROGRAM_ADDRESS });
        const parsedIx = dispatcher.fromTransactionInstruction(instruction);
        if (!isParsedInstruction(parsedIx)) throw new Error('Token slice did not recognise fixture');

        renderWithProviders(
            <TokenDetailsCard
                index={index}
                InstructionCardComponent={InspectorInstructionCard}
                ix={parsedIx}
                raw={instruction}
                result={{ err: null }}
                tx={toParsedTransaction(instruction, message, [parsedIx])}
            />,
            { transactions: false },
        );

        // waitFor's act() boundary absorbs ClusterProvider's post-mount dispatch
        await waitFor(() => {
            expect(screen.getByText(title)).toBeInTheDocument();
        });
    });
});

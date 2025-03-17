import { BaseInstructionCard } from '@components/common/BaseInstructionCard';
import { intoTransactionInstructionFromVersionedMessage } from '@components/inspector/utils';
import { ComputeBudgetProgram, MessageCompiledInstruction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { vi } from 'vitest';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

import { ComputeBudgetDetailsCard } from '../ComputeBudgetDetailsCard';

vi.mock('next/navigation');
// @ts-expect-error does not contain `mockReturnValue`
useSearchParams.mockReturnValue({
    get: () => 'devnet',
    has: (_query?: string) => false,
    toString: () => '',
});

describe('instruction::ComputeBudgetDetailsCard', () => {
    test('should render "SetComputeUnitPrice"', async () => {
        const compiledInstruction: MessageCompiledInstruction = {
            accountKeyIndexes: [],
            data: new Uint8Array([3, 100, 173, 109, 0, 0, 0, 0, 0]),
            programIdIndex: 6,
        };

        const index = 0;
        const m = mock.deserializeMessageV0(stubs.computeBudgetMsg);
        const ti = intoTransactionInstructionFromVersionedMessage(compiledInstruction, m);
        expect(ti.programId.equals(ComputeBudgetProgram.programId)).toBeTruthy();

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <ComputeBudgetDetailsCard
                        ix={ti}
                        index={index}
                        result={{ err: null }}
                        signature={''}
                        InstructionCardComponent={BaseInstructionCard}
                    />
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.getByText(/7.187812 lamports per compute unit/)).toBeInTheDocument();
    });

    test('should render "SetComputeUnitLimit"', async () => {
        const compiledInstruction: MessageCompiledInstruction = {
            accountKeyIndexes: [],
            data: new Uint8Array([2, 18, 96, 2, 0]),
            programIdIndex: 6,
        };

        const index = 1;
        const m = mock.deserializeMessageV0(stubs.computeBudgetMsg);
        const ti = intoTransactionInstructionFromVersionedMessage(compiledInstruction, m);
        expect(ti.programId.equals(ComputeBudgetProgram.programId)).toBeTruthy();

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <ComputeBudgetDetailsCard
                        ix={ti}
                        index={index}
                        result={{ err: null }}
                        signature={''}
                        InstructionCardComponent={BaseInstructionCard}
                    />
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.getByText(/155.666 compute units/)).toBeInTheDocument();
    });
});

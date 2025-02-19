import { BaseInstructionCard } from '@components/common/BaseInstructionCard';
import { intoTransactionInstructionFromVersionedMessage } from '@components/inspector/utils';
import { ComputeBudgetProgram, MessageCompiledInstruction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';

import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

import * as mock from '../../inspector/__tests__/mocks';
import { ComputeBudgetDetailsCard } from '../ComputeBudgetDetailsCard';

jest.mock('next/navigation');
// @ts-expect-error does not contain `mockReturnValue`
useSearchParams.mockReturnValue({
    get: () => 'devnet',
    has: (_query?: string) => false,
    toString: () => '',
});

describe('ComputeBudgetDetailsCard', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should render "SetComputeUnitPrice"', async () => {
        const compiledInstruction: MessageCompiledInstruction = {
            accountKeyIndexes: [],
            data: new Uint8Array([3, 100, 173, 109, 0, 0, 0, 0, 0]),
            programIdIndex: 6,
        };

        const ti = intoTransactionInstructionFromVersionedMessage(
            compiledInstruction,
            mock.deserialize(mock.message1),
            ComputeBudgetProgram.programId
        );
        expect(ti).not.toBeUndefined();
        expect(ti?.programId).toBe(ComputeBudgetProgram.programId);

        // check that component is rendered properly
        ti &&
            render(
                <ScrollAnchorProvider>
                    <ClusterProvider>
                        <ComputeBudgetDetailsCard
                            key={1}
                            ix={ti}
                            index={1}
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

        const ti = intoTransactionInstructionFromVersionedMessage(
            compiledInstruction,
            mock.deserialize(mock.message1),
            ComputeBudgetProgram.programId
        );
        expect(ti).not.toBeUndefined();
        expect(ti?.programId).toBe(ComputeBudgetProgram.programId);

        // check that component is rendered properly
        ti &&
            render(
                <ScrollAnchorProvider>
                    <ClusterProvider>
                        <ComputeBudgetDetailsCard
                            key={1}
                            ix={ti}
                            index={1}
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

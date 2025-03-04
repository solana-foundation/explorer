import { intoTransactionInstructionFromVersionedMessage } from '@components/inspector/utils';
import { ASSOCIATED_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { render, screen } from '@testing-library/react';

import { mockUseSearchParams } from '@/app/__tests__/utils';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

import * as mock from '../../inspector/__tests__/mocks';
import { BaseInstructionCard } from '../BaseInstructionCard';

describe('BaseInstructionCard', () => {
    beforeEach(() => {
        mockUseSearchParams();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should render "BaseInstructionCard"', async () => {
        const index = 1;
        const m = mock.deserializeMessageV0(mock.message2);
        const ti = intoTransactionInstructionFromVersionedMessage(m.compiledInstructions[index], m);
        expect(ti.programId.equals(ASSOCIATED_PROGRAM_ID)).toBeTruthy();

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <BaseInstructionCard ix={ti} index={index} title="Program: Instruction" result={{ err: null }} />
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        // check that card is rendered with proper title
        expect(screen.getByText(/Program: Instruction/)).toBeInTheDocument();
    });

    test('should render "BaseInstructionCard" with raw data', async () => {
        const index = 1;
        const m = mock.deserializeMessageV0(mock.message2);
        const ti = intoTransactionInstructionFromVersionedMessage(m.compiledInstructions[index], m);
        expect(ti.programId.equals(ASSOCIATED_PROGRAM_ID)).toBeTruthy();

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <BaseInstructionCard
                        ix={ti}
                        index={index}
                        title="Program: Instruction"
                        result={{ err: null }}
                        defaultRaw
                    />
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        // instruction should relate to specific program
        expect(await screen.findAllByText(/Associated Token Program/)).toHaveLength(2);
        // we expect specific internal component to be rendered with "defaultRaw"
        expect(screen.getByText('Instruction Data')).toBeInTheDocument();
    });
});

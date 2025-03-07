import { BaseInstructionCard } from '@components/common/BaseInstructionCard';
import { intoTransactionInstructionFromVersionedMessage } from '@components/inspector/utils';
import * as spl from '@solana/spl-token';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

import { ParsedInstructionFactory } from '../../inspector/utils';
import { AssociatedTokenDetailsCard } from '../associated-token/AssociatedTokenDetailsCard';

jest.mock('next/navigation');

describe('inspector::AssociatedTokenDetailsCard', () => {
    beforeEach(() => {
        mock.mockUseSearchParams();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const factory = ParsedInstructionFactory();

    test('should render "CreateIdempotent" card', async () => {
        const index = 1;
        const m = mock.deserializeMessageV0(stubs.aTokenCreateIdempotentMsg);
        const ti = intoTransactionInstructionFromVersionedMessage(m.compiledInstructions[index], m);
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const ix = factory.intoParsedInstruction(ti);

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AssociatedTokenDetailsCard
                        ix={ix}
                        raw={ti}
                        index={index}
                        result={{ err: null }}
                        InstructionCardComponent={BaseInstructionCard}
                    />
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.getByText(/Associated Token Program: Create Idempotent/)).toBeInTheDocument();
    });

    test('should render "Create" card', async () => {
        const index = 2;
        const m = mock.deserializeMessage(stubs.aTokenCreateMsgWithInnerCards);
        const ti = intoTransactionInstructionFromVersionedMessage(m.compiledInstructions[index], m);
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const ix = factory.intoParsedInstruction(ti);

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AssociatedTokenDetailsCard
                        ix={ix}
                        raw={ti}
                        index={index}
                        result={{ err: null }}
                        InstructionCardComponent={BaseInstructionCard}
                    />
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.getByText(/Associated Token Program: Create$/)).toBeInTheDocument();
    });

    test('should render "RecoverNested" card', async () => {
        const index = 0;
        const m = mock.deserializeMessage(stubs.aTokenRecoverNestedMsg);
        const ti = intoTransactionInstructionFromVersionedMessage(m.compiledInstructions[index], m);
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const ix = factory.intoParsedInstruction(ti);

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AssociatedTokenDetailsCard
                        ix={ix}
                        raw={ti}
                        index={index}
                        result={{ err: null }}
                        InstructionCardComponent={BaseInstructionCard}
                    />
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.getByText(/Associated Token Program: Recover Nested/)).toBeInTheDocument();
    });
});

describe('inspector::AssociatedTokenDetailsCard with inner cards', () => {
    beforeEach(() => {
        mock.mockUseSearchParams();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const factory = ParsedInstructionFactory();

    test('should render "CreateIdempotentDetailsCard"', async () => {
        const index = 1;
        const m = mock.deserializeMessageV0(stubs.aTokenCreateIdempotentMsgWithInnerCards);
        const ti = intoTransactionInstructionFromVersionedMessage(m.compiledInstructions[index], m);
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const ix = factory.intoParsedInstruction(ti);

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AssociatedTokenDetailsCard
                        ix={ix}
                        raw={ti}
                        index={index}
                        result={{ err: null }}
                        InstructionCardComponent={BaseInstructionCard}
                    />
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.queryByText(/Inner Instructions/)).not.toBeInTheDocument();
    });
});

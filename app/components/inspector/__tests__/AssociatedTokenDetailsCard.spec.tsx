import { intoTransactionInstructionFromVersionedMessage } from '@components/inspector/utils';
import * as spl from '@solana/spl-token';
import { render, screen } from '@testing-library/react';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

import { intoParsedInstruction } from '../../inspector/into-parsed-data';
import { AssociatedTokenDetailsCard } from '../associated-token/AssociatedTokenDetailsCard';

jest.mock('next/navigation');

describe('inspector::AssociatedTokenDetailsCard', () => {
    beforeEach(() => {
        mock.mockUseSearchParams();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should render "CreateIdempotent" card', async () => {
        const index = 1;
        const m = mock.deserializeMessageV0(stubs.aTokenCreateIdempotentMsg);
        const ti = intoTransactionInstructionFromVersionedMessage(m.compiledInstructions[index], m);
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const ix = intoParsedInstruction(ti);
        console.log(777, ix.parsed);

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AssociatedTokenDetailsCard ix={ix} raw={ti} index={index} result={{ err: null }} />
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.getByText(/Associated Token Program: Create Idempotent/)).toBeInTheDocument();
        expect(screen.getByText(/Wallet/)).toBeInTheDocument();
    });

    test('should render "Create" card', async () => {
        const index = 2;
        const m = mock.deserializeMessage(stubs.aTokenCreateMsgWithInnerCards);
        const ti = intoTransactionInstructionFromVersionedMessage(m.compiledInstructions[index], m);
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const ix = intoParsedInstruction(ti);

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AssociatedTokenDetailsCard ix={ix} raw={ti} index={index} result={{ err: null }} />
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

        const ix = intoParsedInstruction(ti);

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AssociatedTokenDetailsCard ix={ix} raw={ti} index={index} result={{ err: null }} />
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

    test('should render "CreateIdempotentDetailsCard"', async () => {
        const index = 1;
        const m = mock.deserializeMessageV0(stubs.aTokenCreateIdempotentMsgWithInnerCards);
        const ti = intoTransactionInstructionFromVersionedMessage(m.compiledInstructions[index], m);
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const ix = intoParsedInstruction(ti);

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AssociatedTokenDetailsCard ix={ix} raw={ti} index={index} result={{ err: null }} />
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.queryByText(/Inner Instructions/)).not.toBeInTheDocument();
    });
});

/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { SystemProgram } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { screen } from '@testing-library/react';
import { vi } from 'vitest';

import { renderWithProviders } from '@/app/__tests__/card-harness';
import * as stubs from '@/app/__tests__/mock-stubs';
import { decompileStubInstruction } from '@/app/__tests__/mocks';

import { BaseInstructionCard } from '../BaseInstructionCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

describe('BaseInstructionCard', () => {
    test('should render "BaseInstructionCard" with raw data', async () => {
        const index = 1;
        const { instruction } = decompileStubInstruction(stubs.aTokenCreateIdempotentMsg, index, {
            programId: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
        });

        renderWithProviders(
            <BaseInstructionCard
                ix={instruction}
                index={index}
                title="Program: Instruction"
                result={{ err: null }}
                defaultRaw
            />,
            { transactions: false },
        );

        expect(await screen.findByText(/Program: Instruction/)).toBeInTheDocument();
        // instruction should relate to specific program
        expect(screen.getAllByText(/Associated Token Program/)).toHaveLength(1);
        // we expect specific internal component to be rendered with "defaultRaw"
        expect(screen.getByText('Instruction Data')).toBeInTheDocument();
    });

    test('should say so when the accounts and hex data cannot be reconstructed', async () => {
        const parsedIx = {
            parsed: { info: { lamports: 1 }, type: 'transfer' },
            program: 'system',
            programId: SystemProgram.programId,
        };

        renderWithProviders(
            <BaseInstructionCard
                ix={parsedIx}
                index={0}
                title="System: Transfer"
                result={{ err: null }}
                defaultRaw
                rawUnavailable
            />,
            { transactions: false },
        );

        expect(
            await screen.findByText(/Account list and hex data are not available for this transaction version/),
        ).toBeInTheDocument();
    });
});

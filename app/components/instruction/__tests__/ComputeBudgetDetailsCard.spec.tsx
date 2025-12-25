import { BaseInstructionCard } from '@components/common/BaseInstructionCard';
import { ComputeBudgetProgram, TransactionMessage } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { vi } from 'vitest';

import { resolveAddressLookupTables } from '@/app/__tests__/mock-resolvers';
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
    test('should render "SetComputeUnitPrice"', () => {
        const index = 0;
        const m = mock.deserializeMessageV0(stubs.computeBudgetMsg);
        const lookups = resolveAddressLookupTables(m.addressTableLookups);
        const ti = TransactionMessage.decompile(m, {
            addressLookupTableAccounts: lookups,
        }).instructions[index];
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

    test('should render "SetComputeUnitLimit"', () => {
        const index = 1;
        const m = mock.deserializeMessageV0(stubs.computeBudgetMsg);
        const lookups = resolveAddressLookupTables(m.addressTableLookups);
        const ti = TransactionMessage.decompile(m, {
            addressLookupTableAccounts: lookups,
        }).instructions[index];
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
    }, 15000);
});

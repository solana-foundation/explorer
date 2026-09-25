import { TxInstructionSurface } from '@entities/instruction-card';
import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    useRouter: vi.fn(() => ({ push: vi.fn() })),
    useSearchParams: vi.fn(() => ({ get: vi.fn(), has: vi.fn(), toString: () => '' })),
}));

import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { TransactionsProvider } from '@/app/providers/transactions';
import { invariant } from '@/app/shared/lib/invariant';

import { computeBudgetInstructionParser } from '../../lib/compute-budget-client';
import { COMPUTE_BUDGET_PROGRAM_ADDRESS } from '../../lib/compute-budget-parser';
import { ComputeBudgetDetailsCard } from '../ComputeBudgetDetailsCard';

const dispatcher = createInstructionParserDispatcher([computeBudgetInstructionParser]);
const PROGRAM_ID = new PublicKey(COMPUTE_BUDGET_PROGRAM_ADDRESS);

describe('ComputeBudgetDetailsCard', () => {
    it('should render Set Compute Unit Price', async () => {
        renderCard([3, 100, 173, 109, 0, 0, 0, 0, 0]);

        await waitFor(() => {
            expect(readRows()).toEqual([
                ['Program', PROGRAM_ID.toBase58()],
                ['Compute Unit Price', '7.187812 lamports per compute unit'],
            ]);
        });
        expect(screen.getByText('Compute Budget Program: Set Compute Unit Price')).toBeInTheDocument();
    });

    it('should render Set Compute Unit Limit', async () => {
        renderCard([2, 18, 96, 2, 0]);

        await waitFor(() => {
            expect(readRows()[1]).toEqual(['Compute Unit Limit', '155,666 compute units']);
        });
        expect(screen.getByText('Compute Budget Program: Set Compute Unit Limit')).toBeInTheDocument();
    });

    it('should render Request Units with its fee as SOL', async () => {
        renderCard([0, 16, 39, 0, 0, 0, 202, 154, 59]);

        await waitFor(() => {
            expect(readRows()[1]).toEqual(['Requested Compute Units', '10,000 compute units']);
        });
        expect(screen.getByText('Compute Budget Program: Request Units (Deprecated)')).toBeInTheDocument();
        expect(readRows()[2][0]).toBe('Additional Fee (SOL)');
        expect(readRows()[2][1]).toContain('1');
    });

    it('should render Request Heap Frame', async () => {
        renderCard([1, 0, 0, 1, 0]);

        await waitFor(() => {
            expect(readRows()[1]).toEqual(['Requested Heap Frame (Bytes)', '65,536']);
        });
    });

    it('should render Set Loaded Account Data Size Limit', async () => {
        renderCard([4, 0, 0, 16, 0]);

        await waitFor(() => {
            expect(readRows()[1]).toEqual(['Account Data Size Limit', '1048576 bytes']);
        });
        expect(screen.getByText('Compute Budget Program: Set Loaded Account Data Size Limit')).toBeInTheDocument();
    });

    it('should fall back to the raw view for an unknown discriminator', async () => {
        renderCard([9, 1, 2, 3]);

        await waitFor(() => {
            expect(screen.getByText('Compute Budget Program: Unknown Instruction')).toBeInTheDocument();
        });
    });
});

function renderCard(data: number[]) {
    const raw = new TransactionInstruction({ data: Buffer.from(data), keys: [], programId: PROGRAM_ID });
    const dispatched = dispatcher.fromTransactionInstruction(raw);
    invariant(dispatched, 'the compute budget program is registered');

    return render(
        <ScrollAnchorProvider>
            <ClusterProvider>
                <TransactionsProvider>
                    <AccountsProvider>
                        <TxInstructionSurface result={{ err: null }}>
                            <ComputeBudgetDetailsCard ix={dispatched} raw={raw} index={0} />
                        </TxInstructionSurface>
                    </AccountsProvider>
                </TransactionsProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>,
    );
}

/** Each row as `[label, value]`, in render order, so the result pins order as well as content. */
function readRows(): Array<[string, string]> {
    const card = screen.getAllByRole('table')[0];
    return within(card)
        .getAllByRole('row')
        .map(row => {
            const cells = within(row).getAllByRole('cell');
            return [cells[0].textContent ?? '', readAddress(cells[1]) ?? cells[1]?.textContent ?? ''];
        });
}

function readAddress(cell: HTMLElement | undefined): string | undefined {
    return cell?.querySelector('[data-address]')?.getAttribute('data-address') ?? undefined;
}

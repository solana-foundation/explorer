import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { readCardRows, renderTxCard } from '@/app/__tests__/card-harness';
import { invariant } from '@/app/shared/lib/invariant';

import { computeBudgetInstructionParser } from '../../lib/compute-budget-client';
import { COMPUTE_BUDGET_PROGRAM_ADDRESS } from '../../lib/compute-budget-parser';
import { ComputeBudgetDetailsCard } from '../ComputeBudgetDetailsCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

const dispatcher = createInstructionParserDispatcher([computeBudgetInstructionParser]);
const PROGRAM_ID = new PublicKey(COMPUTE_BUDGET_PROGRAM_ADDRESS);

describe('ComputeBudgetDetailsCard', () => {
    it.each([
        {
            data: [3, 100, 173, 109, 0, 0, 0, 0, 0],
            rows: [['Compute Unit Price', '7.187812 lamports per compute unit']],
            title: 'Set Compute Unit Price',
        },
        {
            data: [2, 18, 96, 2, 0],
            rows: [['Compute Unit Limit', '155,666 compute units']],
            title: 'Set Compute Unit Limit',
        },
        {
            data: [0, 16, 39, 0, 0, 0, 202, 154, 59],
            rows: [
                ['Requested Compute Units', '10,000 compute units'],
                ['Additional Fee (SOL)', '◎1'],
            ],
            title: 'Request Units (Deprecated)',
        },
        { data: [1, 0, 0, 1, 0], rows: [['Requested Heap Frame (Bytes)', '65,536']], title: 'Request Heap Frame' },
        {
            data: [4, 0, 0, 16, 0],
            rows: [['Account Data Size Limit', '1048576 bytes']],
            title: 'Set Loaded Account Data Size Limit',
        },
    ])('should render $title', async ({ data, rows, title }) => {
        renderCard(data);

        await waitFor(() => {
            expect(readCardRows()).toEqual([['Program', PROGRAM_ID.toBase58()], ...rows]);
        });
        expect(screen.getByText(`Compute Budget Program: ${title}`)).toBeInTheDocument();
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

    return renderTxCard(<ComputeBudgetDetailsCard ix={dispatched} raw={raw} index={0} />);
}

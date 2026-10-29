import { InstructionNodeCard } from '@components/instruction/InstructionNodeCard';
import { inspectorSurface, InstructionSurfaceProvider, toRawInstructionNode } from '@entities/instruction-card';
import { TOKEN_2022_PROGRAM_ID } from '@providers/accounts/tokens';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { readCardRows, renderTxCard, renderWithProviders } from '@/app/__tests__/card-harness';
import { concatBytes, writeU64LE } from '@/app/shared/lib/bytes';

import { makeAccount, makeBatchIx, makeBatchIxWithKeys } from '../../lib/__tests__/test-utils';
import { TokenBatchCard } from '../TokenBatchCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

const TRANSFER_DATA = concatBytes(new Uint8Array([3]), writeU64LE(1_000_000n));

describe('TokenBatchCard', () => {
    it.each([
        { render: renderTxCard, surface: 'tx page' },
        { render: renderInspectorCard, surface: 'inspector' },
    ])('should draw one Program row and a Collapse button on the $surface surface', async ({ render }) => {
        const ix = makeBatchIx([{ data: TRANSFER_DATA, numAccounts: 3 }], 3);
        render(<TokenBatchCard node={toRawInstructionNode({ index: 0, ix })} />);

        await waitFor(() => {
            expect(screen.getByText('Token Program: Batch (1 instruction)')).toBeInTheDocument();
        });
        expect(readCardRows().filter(([label]) => label === 'Program')).toEqual([
            ['Program', TOKEN_2022_PROGRAM_ID.toBase58()],
        ]);
        expect(screen.getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
    });

    it('should draw a heading and the rows of each sub-instruction', async () => {
        const accounts = [makeAccount(true, false), makeAccount(true, false), makeAccount(false, true)];
        const ix = makeBatchIxWithKeys([{ data: TRANSFER_DATA, numAccounts: 3 }], accounts);
        renderTxCard(<TokenBatchCard node={toRawInstructionNode({ index: 0, ix })} />);

        await waitFor(() => {
            expect(readCardRows().map(([label]) => label)).toEqual([
                'Program',
                '#1 Transfer',
                'Amount',
                'SourceWritable',
                'DestinationWritable',
                'Owner/DelegateSigner',
            ]);
        });
        expect(readCardRows()[3]).toEqual(['SourceWritable', accounts[0].pubkey.toBase58()]);
    });

    it('should show why the batch does not parse', async () => {
        const ix = makeBatchIx([{ data: new Uint8Array([0xfe]), numAccounts: 1 }], 1);
        renderTxCard(<TokenBatchCard node={toRawInstructionNode({ index: 0, ix })} />);

        await waitFor(() => {
            expect(readCardRows().map(([label]) => label)).toEqual(['Program', 'Parse Error']);
        });
    });
});

function renderInspectorCard(ui: JSX.Element) {
    return renderWithProviders(
        <InstructionSurfaceProvider
            surface={inspectorSurface({ Card: InstructionNodeCard, instructionData: () => undefined })}
        >
            {ui}
        </InstructionSurfaceProvider>,
    );
}

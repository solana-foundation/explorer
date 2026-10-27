import { inspectorSurface } from '@components/inspector/inspector-surface';
import { InstructionSurfaceProvider, toInstructionNode } from '@entities/instruction-card';
import { TOKEN_2022_PROGRAM_ID } from '@providers/accounts/tokens';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { readCardRows, renderTxCard, renderWithProviders } from '@/app/__tests__/card-harness';
import { concatBytes, writeU64LE } from '@/app/shared/lib/bytes';

import { makeBatchIx } from '../../lib/__tests__/test-utils';
import { TokenBatchCard } from '../TokenBatchCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

const TRANSFER_DATA = concatBytes(new Uint8Array([3]), writeU64LE(1_000_000n));

describe('TokenBatchCard', () => {
    it.each([
        { render: renderTxCard, surface: 'tx page' },
        { render: renderInspectorCard, surface: 'inspector' },
    ])('should draw one Program row and a Collapse button on the $surface surface', async ({ render }) => {
        const ix = makeBatchIx([{ data: TRANSFER_DATA, numAccounts: 3 }], 3);
        render(<TokenBatchCard node={toInstructionNode({ index: 0, ix })} ix={ix} />);

        await waitFor(() => {
            expect(screen.getByText('Token Program: Batch (1 instruction)')).toBeInTheDocument();
        });
        expect(readCardRows().filter(([label]) => label === 'Program')).toEqual([
            ['Program', TOKEN_2022_PROGRAM_ID.toBase58()],
        ]);
        expect(screen.getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
    });

    it('should draw its frame with the Shell of the surface', async () => {
        const ix = makeBatchIx([{ data: TRANSFER_DATA, numAccounts: 3 }], 3);
        renderWithProviders(
            <InstructionSurfaceProvider
                surface={{
                    ...inspectorSurface(() => undefined),
                    Shell: ({ title }) => <div data-testid="shell">{title}</div>,
                }}
            >
                <TokenBatchCard node={toInstructionNode({ index: 0, ix })} ix={ix} />
            </InstructionSurfaceProvider>,
        );

        expect(await screen.findByTestId('shell')).toHaveTextContent('Token Program: Batch (1 instruction)');
    });
});

function renderInspectorCard(ui: JSX.Element) {
    return renderWithProviders(
        <InstructionSurfaceProvider surface={inspectorSurface(() => undefined)}>{ui}</InstructionSurfaceProvider>,
    );
}

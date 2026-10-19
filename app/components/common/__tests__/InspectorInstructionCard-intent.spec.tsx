import { InstructionIntentProvider } from '@entities/instruction-intent';
import { SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

import { InspectorInstructionCard } from '../InspectorInstructionCard';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    useRouter: vi.fn(() => ({ replace: vi.fn() })),
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));
vi.mock('@/app/entities/instruction-intent/model/use-instruction-intent', () => ({
    useInstructionIntent: () => ({ reason: 'no-metadata', status: 'unavailable' }),
}));

function renderInspectorInstructionCard({
    cardChildIndex,
    providerInnerIxIndex,
}: { cardChildIndex?: number; providerInnerIxIndex?: number } = {}) {
    const ix = new TransactionInstruction({ data: Buffer.from([1]), keys: [], programId: SystemProgram.programId });

    return render(
        <ScrollAnchorProvider>
            <ClusterProvider>
                <InstructionIntentProvider
                    programId={SystemProgram.programId.toBase58()}
                    ixFetchResult={{ status: 'loading' }}
                    innerIxIndex={providerInnerIxIndex}
                >
                    <InspectorInstructionCard
                        ix={ix}
                        index={0}
                        childIndex={cardChildIndex}
                        title="System Program: Transfer"
                        result={{ err: null }}
                    />
                </InstructionIntentProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>,
    );
}

describe('InspectorInstructionCard intent', () => {
    it('should open the intent row when the button on a top-level card is clicked', async () => {
        renderInspectorInstructionCard();

        await userEvent.click(await screen.findByTestId('instruction-intent-trigger'));

        expect(screen.getByTestId('instruction-intent-panel')).toBeInTheDocument();
    });

    it("should not show the parent's intent when an inner card sits in the parent's provider", async () => {
        renderInspectorInstructionCard({ cardChildIndex: 0 });

        expect(await screen.findByText('System Program: Transfer')).toBeInTheDocument();
        expect(screen.queryByTestId('instruction-intent-trigger')).not.toBeInTheDocument();
    });

    it('should open the intent row when the button on an inner card with its own provider is clicked', async () => {
        renderInspectorInstructionCard({ cardChildIndex: 0, providerInnerIxIndex: 0 });

        await userEvent.click(await screen.findByTestId('instruction-intent-trigger'));

        expect(screen.getByTestId('instruction-intent-panel')).toBeInTheDocument();
    });
});

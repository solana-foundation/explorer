import { InstructionIntentProvider } from '@entities/instruction-intent';
import { SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

import { BaseInstructionCard } from '../BaseInstructionCard';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    useRouter: vi.fn(() => ({ replace: vi.fn() })),
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));
vi.mock('@/app/entities/instruction-intent/model/use-instruction-intent', () => ({
    useInstructionIntent: () => ({ reason: 'no-metadata', status: 'unavailable' }),
}));

function renderBaseInstructionCard({ childIndex }: { childIndex?: number } = {}) {
    const ix = new TransactionInstruction({ data: Buffer.from([1]), keys: [], programId: SystemProgram.programId });

    return render(
        <ScrollAnchorProvider>
            <ClusterProvider>
                <InstructionIntentProvider
                    programId={SystemProgram.programId.toBase58()}
                    ixFetchResult={{ status: 'loading' }}
                >
                    <BaseInstructionCard
                        ix={ix}
                        index={0}
                        childIndex={childIndex}
                        title="System Program: Transfer"
                        result={{ err: null }}
                    />
                </InstructionIntentProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>,
    );
}

describe('BaseInstructionCard intent', () => {
    it('should open the intent row when the button on a top-level card is clicked', async () => {
        renderBaseInstructionCard();

        await userEvent.click(await screen.findByTestId('instruction-intent-trigger'));

        expect(screen.getByTestId('instruction-intent-panel')).toBeInTheDocument();
    });

    it('should not show the intent button when the card is an inner card', async () => {
        renderBaseInstructionCard({ childIndex: 0 });

        expect(await screen.findByText('System Program: Transfer')).toBeInTheDocument();
        expect(screen.queryByTestId('instruction-intent-trigger')).not.toBeInTheDocument();
    });
});

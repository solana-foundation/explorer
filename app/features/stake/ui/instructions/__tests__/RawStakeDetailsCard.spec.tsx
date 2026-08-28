import { TxInstructionSurface } from '@entities/instruction-card';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { STAKE_PROGRAM_ADDRESS } from '@solana-program/stake';
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

import { RawStakeDetailsCard } from '../RawStakeDetailsCard';

const STAKE_PROGRAM_ID = new PublicKey(STAKE_PROGRAM_ADDRESS);

/** Stake discriminators, as the u32 the classifier reads. */
const GET_MINIMUM_DELEGATION = 13;
const INITIALIZE = 0;
const UNRECOGNIZED = 999;

function instruction(discriminator: number, programId = STAKE_PROGRAM_ID): TransactionInstruction {
    const data = Buffer.alloc(4);
    data.writeUInt32LE(discriminator);
    return new TransactionInstruction({ data, keys: [], programId });
}

describe('stake::RawStakeDetailsCard', () => {
    it('should render the dedicated card for the Get Minimum Delegation discriminator', async () => {
        renderCard(instruction(GET_MINIMUM_DELEGATION));

        await waitFor(() => {
            expect(screen.getByText('Stake Program: Get Minimum Delegation')).toBeInTheDocument();
        });
    });

    it('should fall back to Unknown for an instruction the parsed path owns', async () => {
        renderCard(instruction(INITIALIZE));

        await waitFor(() => {
            expect(screen.getByText('Stake Program: Unknown Instruction')).toBeInTheDocument();
        });
    });

    it('should fall back to Unknown for an unrecognized discriminator', async () => {
        renderCard(instruction(UNRECOGNIZED));

        await waitFor(() => {
            expect(screen.getByText('Stake Program: Unknown Instruction')).toBeInTheDocument();
        });
    });

    // The node this card hand-builds carries the address, so a foreign program id proves the
    // Program row reads the instruction rather than a stake-program constant.
    it('should build the Program row from the instruction', async () => {
        const foreign = new PublicKey('4QUZQ4c7bZuJ4o4L8tYAEGnePFV27SUFEVmC7BYfsXRp');
        renderCard(instruction(GET_MINIMUM_DELEGATION, foreign));

        await waitFor(() => {
            expect(readProgramRow()).toBe(foreign.toBase58());
        });
    });
});

function renderCard(ix: TransactionInstruction) {
    return render(
        <ScrollAnchorProvider>
            <ClusterProvider>
                <TransactionsProvider>
                    <AccountsProvider>
                        <TxInstructionSurface result={{ err: null }}>
                            <RawStakeDetailsCard ix={ix} index={0} result={{ err: null }} />
                        </TxInstructionSurface>
                    </AccountsProvider>
                </TransactionsProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>,
    );
}

function readProgramRow(): string {
    const row = screen.getAllByRole('row').find(r => within(r).getAllByRole('cell')[0]?.textContent === 'Program');
    return row?.querySelector('[data-address]')?.getAttribute('data-address') ?? '';
}

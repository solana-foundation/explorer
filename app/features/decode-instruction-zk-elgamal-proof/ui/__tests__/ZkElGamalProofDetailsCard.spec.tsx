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

import { zkElGamalProofInstructionParser } from '../../lib/zk-elgamal-proof-client';
import { ZK_ELGAMAL_PROOF_PROGRAM_ADDRESS } from '../../lib/zk-elgamal-proof-parser';
import { ZkElGamalProofDetailsCard } from '../ZkElGamalProofDetailsCard';

const PROGRAM_ID = new PublicKey(ZK_ELGAMAL_PROOF_PROGRAM_ADDRESS);
const CONTEXT_STATE = 'FagABcRBhZH27JDtu6A1Jo9woXyoznP28QujLkxkN9Hj';
const DESTINATION = 'GgU1RSCbCTNfjPqBGnR7NBDZoLQwB7oEjnHqzGtcCLBH';
const AUTHORITY = '7txXZZD6Um59YoLMF7XUNimbMjsqsWhc7g2EniiTrmp1';

const dispatcher = createInstructionParserDispatcher([zkElGamalProofInstructionParser]);

type Row = [string, string];

describe('ZkElGamalProofDetailsCard', () => {
    it('should render Close Context State with its named accounts', async () => {
        renderCard(instruction([0], [CONTEXT_STATE, DESTINATION, AUTHORITY]));

        await waitFor(() => {
            expect(readRows()).toEqual([
                ['Program', PROGRAM_ID.toBase58()],
                ['Context State Account', CONTEXT_STATE],
                ['Destination', DESTINATION],
                ['Authority', AUTHORITY],
            ]);
        });
        expect(screen.getByText('ZK ElGamal Proof Program: Close Context State')).toBeInTheDocument();
    });

    it('should render an inline proof under the instruction name with its size', async () => {
        renderCard(instruction([3, 1, 2, 3]));

        await waitFor(() => {
            expect(readRows()).toEqual([
                ['Program', PROGRAM_ID.toBase58()],
                ['Proof Size', '3 bytes'],
            ]);
        });
        expect(screen.getByText('ZK ElGamal Proof Program: Verify Ciphertext-Commitment Equality')).toBeInTheDocument();
    });

    it('should render a record-account proof with its offset and the context state pair', async () => {
        renderCard(instruction([6, 8, 0, 0, 0], [DESTINATION, CONTEXT_STATE, AUTHORITY]));

        await waitFor(() => {
            expect(readRows()).toEqual([
                ['Program', PROGRAM_ID.toBase58()],
                ['Record Account', DESTINATION],
                ['Proof Offset', '8'],
                ['Context State Account', CONTEXT_STATE],
                ['Context State Authority', AUTHORITY],
            ]);
        });
        expect(screen.getByText('ZK ElGamal Proof Program: Verify Batched Range Proof (U64)')).toBeInTheDocument();
    });

    it('should fall back to a raw card on an unknown discriminator', async () => {
        renderCard(instruction([99]));

        await waitFor(() => {
            expect(screen.getByText('ZK ElGamal Proof Program: Unknown Instruction')).toBeInTheDocument();
        });
    });
});

function instruction(data: number[], keys: string[] = []): TransactionInstruction {
    return new TransactionInstruction({
        data: Buffer.from(data),
        keys: keys.map(key => ({ isSigner: false, isWritable: false, pubkey: new PublicKey(key) })),
        programId: PROGRAM_ID,
    });
}

function renderCard(ix: TransactionInstruction) {
    const dispatched = dispatcher.fromTransactionInstruction(ix);
    if (!dispatched) throw new Error('parser not registered');
    return render(
        <ScrollAnchorProvider>
            <ClusterProvider>
                <TransactionsProvider>
                    <AccountsProvider>
                        <TxInstructionSurface result={{ err: null }}>
                            <ZkElGamalProofDetailsCard ix={dispatched} raw={ix} index={0} />
                        </TxInstructionSurface>
                    </AccountsProvider>
                </TransactionsProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>,
    );
}

function readRows(): Row[] {
    const card = screen.getAllByRole('table')[0];
    return within(card)
        .getAllByRole('row')
        .filter(row => row.closest('table') === card)
        .map(row => {
            const cells = within(row).getAllByRole('cell');
            return [cells[0].textContent ?? '', readAddress(cells[1]) ?? cells[1]?.textContent ?? ''];
        });
}

function readAddress(cell: HTMLElement | undefined): string | undefined {
    return cell?.querySelector('[data-address]')?.getAttribute('data-address') ?? undefined;
}

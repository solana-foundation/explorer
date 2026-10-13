/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { gen } from '@__fixtures__/gen';
import { TxInstructionSurface } from '@entities/instruction-card';
import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { MANGO_PROGRAM_IDS } from '@explorer/decoder-mango';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    useRouter: vi.fn(() => ({ push: vi.fn() })),
    useSearchParams: vi.fn(() => ({ get: vi.fn(), has: vi.fn(), toString: () => '' })),
}));

import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { TransactionsProvider } from '@/app/providers/transactions';

import { mangoInstructionParsers } from '../../lib/mango-client';
import { MANGO_PROGRAM_LABEL } from '../../lib/mango-parser';
import { MangoDetailsCard } from '../MangoDetailsCard';

const dispatcher = createInstructionParserDispatcher(mangoInstructionParsers);

describe('MangoDetailsCard', () => {
    it('should title the card with the instruction name', async () => {
        const raw = makeInstruction([2, 0, 0, 0]);

        expect(dispatcher.fromTransactionInstruction(raw)).toMatchObject({
            parsed: { info: {}, type: 'Deposit' },
            program: MANGO_PROGRAM_LABEL,
        });

        renderCard(raw);

        await waitFor(() => {
            expect(screen.getByText(/Mango v3 \(deprecated\): Deposit$/)).toBeInTheDocument();
        });
    });

    it('should fall back to "Unknown" for a discriminator outside the name table', async () => {
        renderCard(makeInstruction([255, 255, 0, 0]));

        await waitFor(() => {
            expect(screen.getByText(/Mango v3 \(deprecated\): Unknown$/)).toBeInTheDocument();
        });
    });

    it('should title an instruction without data "Unknown"', async () => {
        renderCard(makeInstruction([]));

        await waitFor(() => {
            expect(screen.getByText(/Mango v3 \(deprecated\): Unknown$/)).toBeInTheDocument();
        });
    });
});

function makeInstruction(data: number[]): TransactionInstruction {
    return new TransactionInstruction({
        data: Buffer.from(data),
        keys: [{ isSigner: false, isWritable: false, pubkey: gen.publicKey(0) }],
        programId: new PublicKey(MANGO_PROGRAM_IDS.mainnet),
    });
}

function renderCard(raw: TransactionInstruction) {
    const dispatched = dispatcher.fromTransactionInstruction(raw);
    if (!dispatched) throw new Error('no Mango parser registered for the fixture program id');

    return render(
        <ScrollAnchorProvider>
            <ClusterProvider>
                <TransactionsProvider>
                    <AccountsProvider>
                        <TxInstructionSurface result={{ err: null }}>
                            <MangoDetailsCard ix={dispatched} raw={raw} index={0} />
                        </TxInstructionSurface>
                    </AccountsProvider>
                </TransactionsProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>,
    );
}

/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { gen } from '@__fixtures__/gen';
import { TxInstructionSurface } from '@entities/instruction-card';
import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { TOKEN_SWAP_PROGRAM_IDS } from '@explorer/decoder-token-swap';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    useRouter: vi.fn(() => ({ push: vi.fn() })),
    useSearchParams: vi.fn(() => ({ get: vi.fn(), has: vi.fn(), toString: () => '' })),
}));

vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn() } }));

import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { TransactionsProvider } from '@/app/providers/transactions';
import { Logger } from '@/app/shared/lib/logger';

import { tokenSwapInstructionParsers } from '../../lib/token-swap-client';
import { TOKEN_SWAP_PROGRAM_LABEL } from '../../lib/token-swap-parser';
import { TokenSwapDetailsCard } from '../TokenSwapDetailsCard';

const dispatcher = createInstructionParserDispatcher(tokenSwapInstructionParsers);

describe('TokenSwapDetailsCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should title the card with the instruction name', async () => {
        const raw = makeInstruction([1]);

        expect(dispatcher.fromTransactionInstruction(raw)).toMatchObject({
            parsed: { info: {}, type: 'Swap' },
            program: TOKEN_SWAP_PROGRAM_LABEL,
        });

        renderCard(raw);

        await waitFor(() => {
            expect(screen.getByText(/Token Swap: Swap$/)).toBeInTheDocument();
        });
    });

    it('should fall back to "Unknown" for a tag outside the name table', async () => {
        renderCard(makeInstruction([255]));

        await waitFor(() => {
            expect(screen.getByText(/Token Swap: Unknown$/)).toBeInTheDocument();
        });
        // A tag outside the name table means the vendored table is stale, so it is reported.
        expect(Logger.error).toHaveBeenCalledOnce();
    });
});

function makeInstruction(data: number[]): TransactionInstruction {
    return new TransactionInstruction({
        data: Buffer.from(data),
        keys: [{ isSigner: false, isWritable: false, pubkey: gen.publicKey(0) }],
        programId: new PublicKey(TOKEN_SWAP_PROGRAM_IDS[0]),
    });
}

function renderCard(raw: TransactionInstruction) {
    const dispatched = dispatcher.fromTransactionInstruction(raw);
    if (!dispatched) throw new Error('no Token Swap parser registered for the fixture program id');

    return render(
        <ScrollAnchorProvider>
            <ClusterProvider>
                <TransactionsProvider>
                    <AccountsProvider>
                        <TxInstructionSurface result={{ err: null }}>
                            <TokenSwapDetailsCard ix={dispatched} raw={raw} index={0} />
                        </TxInstructionSurface>
                    </AccountsProvider>
                </TransactionsProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>,
    );
}

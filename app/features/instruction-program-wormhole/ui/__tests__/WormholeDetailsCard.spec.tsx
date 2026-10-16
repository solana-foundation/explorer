/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { gen } from '@__fixtures__/gen';
import { TxInstructionSurface } from '@entities/instruction-card';
import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { WORMHOLE_PROGRAM_IDS } from '@explorer/decoder-wormhole';
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

import { wormholeInstructionParsers } from '../../lib/wormhole-client';
import { WORMHOLE_PROGRAM_LABEL } from '../../lib/wormhole-parser';
import { WormholeDetailsCard } from '../WormholeDetailsCard';

const dispatcher = createInstructionParserDispatcher(wormholeInstructionParsers);

describe('WormholeDetailsCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should title the card with the instruction name', async () => {
        const raw = makeInstruction([2]);

        expect(dispatcher.fromTransactionInstruction(raw)).toMatchObject({
            parsed: { info: {}, type: 'Post VAA' },
            program: WORMHOLE_PROGRAM_LABEL,
        });

        renderCard(raw);

        await waitFor(() => {
            expect(screen.getByText(/Wormhole: Post VAA$/)).toBeInTheDocument();
        });
    });

    it('should fall back to "Unknown" for a tag outside the name table', async () => {
        renderCard(makeInstruction([255]));

        await waitFor(() => {
            expect(screen.getByText(/Wormhole: Unknown$/)).toBeInTheDocument();
        });
        // A tag outside the name table means the vendored table is stale, so it is reported.
        expect(Logger.error).toHaveBeenCalledOnce();
    });
});

function makeInstruction(data: number[]): TransactionInstruction {
    return new TransactionInstruction({
        data: Buffer.from(data),
        keys: [{ isSigner: false, isWritable: false, pubkey: gen.publicKey(0) }],
        programId: new PublicKey(WORMHOLE_PROGRAM_IDS[0]),
    });
}

function renderCard(raw: TransactionInstruction) {
    const dispatched = dispatcher.fromTransactionInstruction(raw);
    if (!dispatched) throw new Error('no Wormhole parser registered for the fixture program id');

    return render(
        <ScrollAnchorProvider>
            <ClusterProvider>
                <TransactionsProvider>
                    <AccountsProvider>
                        <TxInstructionSurface result={{ err: null }}>
                            <WormholeDetailsCard ix={dispatched} raw={raw} index={0} />
                        </TxInstructionSurface>
                    </AccountsProvider>
                </TransactionsProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>,
    );
}

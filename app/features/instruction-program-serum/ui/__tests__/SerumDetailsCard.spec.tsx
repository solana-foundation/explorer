/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { gen } from '@__fixtures__/gen';
import { OPEN_BOOK_PROGRAM_IDS } from '@explorer/decoder-serum';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { render, screen, waitFor } from '@testing-library/react';
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

import { SerumDetailsCard } from '../SerumDetailsCard';

// Authentic instruction data from mainnet OpenBook txs (2fHxffhsx9pJ… / 2DJ9K7gZfmtU…).
const NEW_ORDER_V3_DATA =
    '000a0000000100000050c30000000000000400000000000000400d03000000000000000000010000000000000000000000ffff';
const CONSUME_EVENTS_DATA = '00030000002000';

function makeInstruction(dataHex: string, keyCount: number): TransactionInstruction {
    return new TransactionInstruction({
        data: Buffer.from(dataHex, 'hex'),
        keys: Array.from({ length: keyCount }, (_, i) => ({
            isSigner: false,
            isWritable: false,
            pubkey: gen.publicKey(i),
        })),
        programId: new PublicKey(OPEN_BOOK_PROGRAM_IDS.mainnet),
    });
}

function renderCard(ix: TransactionInstruction) {
    return render(
        <ScrollAnchorProvider>
            <ClusterProvider>
                <TransactionsProvider>
                    <AccountsProvider>
                        <SerumDetailsCard index={0} ix={ix} result={{ err: null }} signature={gen.signature(0)} />
                    </AccountsProvider>
                </TransactionsProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>,
    );
}

describe('@features/instruction-program-serum', () => {
    describe('SerumDetailsCard', () => {
        test('should render decoded fields for a New Order v3 instruction', async () => {
            renderCard(makeInstruction(NEW_ORDER_V3_DATA, 12));

            // waitFor's act() boundary absorbs ClusterProvider's post-mount dispatch
            await waitFor(() => {
                expect(screen.getByText(/OpenBook Dex Program: New Order v3/)).toBeInTheDocument();
            });
            expect(screen.getByText('Market')).toBeInTheDocument();
            expect(screen.getByText('Open Orders Owner')).toBeInTheDocument();
            expect(screen.getByText('Side')).toBeInTheDocument();
            expect(screen.getByText('SELL')).toBeInTheDocument();
            expect(screen.getByText('Limit Price')).toBeInTheDocument();
            expect(screen.getByText('50000')).toBeInTheDocument();
            // the optional 13th account is absent, so its row must not render
            expect(screen.queryByText('Fee Discount Pubkey')).not.toBeInTheDocument();
        });

        test('should stack every open-orders account into one row for a Consume Events instruction', async () => {
            // 6 keys: openOrders = keys[0..1], market = keys[2], eventQueue = keys[3]
            renderCard(makeInstruction(CONSUME_EVENTS_DATA, 6));

            // waitFor's act() boundary absorbs ClusterProvider's post-mount dispatch
            await waitFor(() => {
                expect(screen.getByText(/OpenBook Dex Program: Consume Events/)).toBeInTheDocument();
            });
            expect(screen.getByText('Open Orders')).toBeInTheDocument();
            expect(screen.getByText(gen.publicKey(0).toBase58())).toBeInTheDocument();
            expect(screen.getByText(gen.publicKey(1).toBase58())).toBeInTheDocument();
            expect(screen.getByText('Event Queue')).toBeInTheDocument();
            expect(screen.getByText('Limit')).toBeInTheDocument();
            expect(screen.getByText('32')).toBeInTheDocument();
        });

        test('should fall back to the raw card with an "Unknown" title for undecodable data', async () => {
            renderCard(makeInstruction('00ff000000', 0));

            // waitFor's act() boundary absorbs ClusterProvider's post-mount dispatch
            await waitFor(() => {
                expect(screen.getByText(/OpenBook Dex Program: Unknown/)).toBeInTheDocument();
            });
            expect(screen.queryByText('Market')).not.toBeInTheDocument();
        });
    });
});

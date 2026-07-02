/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { DEFAULT_SIGNATURE, gen } from '@__fixtures__/gen';
import { OPEN_BOOK_PROGRAM_IDS, SERUM_DEX_V3_PROGRAM_IDS } from '@explorer/decoder-serum';
import { type ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';
import { mockParsedTransactionDetails, mockTransactionStatus } from '@storybook-config/__fixtures__/transactions';
import { render, screen, waitFor } from '@testing-library/react';
import bs58 from 'bs58';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    useRouter: vi.fn(() => ({ push: vi.fn() })),
    useSearchParams: vi.fn(() => ({ get: vi.fn(), has: vi.fn(), toString: () => '' })),
}));
// IDL lookups fetch over the network; the serum dispatch under test resolves before either would matter.
vi.mock('@entities/idl', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/idl')>()),
    useAnchorProgram: () => ({ program: undefined }),
}));
vi.mock('@/app/entities/program-metadata', async importOriginal => ({
    ...(await importOriginal<typeof import('@/app/entities/program-metadata')>()),
    useProgramMetadataIdl: () => ({ programMetadataIdl: undefined }),
}));

import { withTransactionProviders } from '../__fixtures__/withTransactionProviders';
import { InstructionsSection } from '../InstructionsSection';

const KEYS = Array.from({ length: 6 }, (_, i) => gen.publicKey(i));
const DEPRECATED_PROGRAM = new PublicKey(SERUM_DEX_V3_PROGRAM_IDS.mainnet);
const OPENBOOK_PROGRAM = new PublicKey(OPEN_BOOK_PROGRAM_IDS.mainnet);

// serum wire data = version byte + u32 LE code (+ params); code 2 = Match Orders, code 3 = Consume Events
const MATCH_ORDERS_DATA = bs58.encode(Buffer.from('00020000000500', 'hex'));
const CONSUME_EVENTS_DATA = bs58.encode(Buffer.from('00030000002000', 'hex'));

const TX = {
    blockTime: 1_716_000_000,
    meta: {
        computeUnitsConsumed: 5000,
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: [],
        postBalances: [],
        postTokenBalances: [],
        preBalances: [],
        preTokenBalances: [],
        rewards: [],
    },
    slot: 312_456_789,
    transaction: {
        message: {
            accountKeys: [
                ...KEYS.map(pubkey => ({ pubkey, signer: false, source: 'transaction', writable: true })),
                { pubkey: DEPRECATED_PROGRAM, signer: false, source: 'transaction', writable: false },
                { pubkey: OPENBOOK_PROGRAM, signer: false, source: 'transaction', writable: false },
            ],
            addressTableLookups: [],
            instructions: [
                { accounts: KEYS.slice(0, 5), data: MATCH_ORDERS_DATA, programId: DEPRECATED_PROGRAM },
                { accounts: KEYS, data: CONSUME_EVENTS_DATA, programId: OPENBOOK_PROGRAM },
            ],
            recentBlockhash: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
        },
        signatures: [DEFAULT_SIGNATURE],
    },
    version: 'legacy',
} as unknown as ParsedTransactionWithMeta;

function renderSection() {
    const Wrapper = withTransactionProviders(
        { [DEFAULT_SIGNATURE]: mockParsedTransactionDetails({ transactionWithMeta: TX }) },
        { [DEFAULT_SIGNATURE]: mockTransactionStatus() },
    );
    return render(
        <Wrapper>
            <InstructionsSection signature={DEFAULT_SIGNATURE} />
        </Wrapper>,
    );
}

describe('@features/transaction', () => {
    describe('InstructionsSection serum dispatch', () => {
        test('should render a deprecated Serum DEX instruction as the generic name-only card', async () => {
            renderSection();

            await waitFor(() => {
                expect(screen.getByText(/Serum Dex v3 \(deprecated\): Match Orders/)).toBeInTheDocument();
            });
        });

        test('should render an OpenBook instruction through the decoded serum card', async () => {
            renderSection();

            // the serum card is loaded via next/dynamic, so wait for the chunk to resolve
            await waitFor(() => {
                expect(screen.getByText(/OpenBook Dex Program: Consume Events/)).toBeInTheDocument();
            });
            expect(screen.getByText('Event Queue')).toBeInTheDocument();
        });
    });
});

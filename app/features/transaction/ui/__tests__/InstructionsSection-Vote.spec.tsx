/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { VOTE_PROGRAM_ADDRESS } from '@features/vote';
import { type ParsedTransaction, PublicKey } from '@solana/web3.js';
import { screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { renderWithProviders } from '@/app/__tests__/card-harness';
import mainnetTowerSync from '@/app/features/vote/lib/__fixtures__/mainnet-tower-sync.json';
import { instructionParserDispatcher } from '@/app/tx/instruction-parser-dispatcher';

import { InstructionsSection } from '../InstructionsSection';

const [VOTE_ACCOUNT, VOTE_AUTHORITY] = mainnetTowerSync.accounts.map(account => new PublicKey(account));

// The TowerSync arrives as a raw instruction (no `parsed` key), as it does when the RPC could not
// pre-parse it. `as unknown as` because the fixture carries only the fields the section reads.
const PARSED_TX = {
    message: {
        accountKeys: [
            { pubkey: VOTE_AUTHORITY, signer: true, source: 'transaction', writable: true },
            { pubkey: VOTE_ACCOUNT, signer: false, source: 'transaction', writable: true },
        ],
        addressTableLookups: null,
        instructions: [
            {
                accounts: [VOTE_ACCOUNT, VOTE_AUTHORITY],
                data: mainnetTowerSync.data,
                programId: new PublicKey(VOTE_PROGRAM_ADDRESS),
            },
        ],
        recentBlockhash: PublicKey.default.toBase58(),
    },
    signatures: [mainnetTowerSync.signature],
} as unknown as ParsedTransaction;

vi.mock('swr', () => ({
    __esModule: true,
    default: vi.fn(() => ({
        data: undefined,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
    })),
}));

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

vi.mock('@providers/transactions', async importOriginal => ({
    ...(await importOriginal<typeof import('@providers/transactions')>()),
    useTransactionDetails: vi.fn(() => ({
        data: { transactionWithMeta: { meta: null, slot: 1, transaction: PARSED_TX } },
    })),
    useTransactionStatus: vi.fn(() => ({ data: { info: { result: { err: null } } } })),
}));

describe('Transaction page InstructionsSection with a raw vote instruction', () => {
    test('should decode the bytes and render the vote card', async () => {
        renderWithProviders(<InstructionsSection signature={mainnetTowerSync.signature} />, {
            dispatcher: instructionParserDispatcher,
        });

        expect(await screen.findByText(/Vote: Tower Sync/i)).toBeInTheDocument();
        expect(screen.getByText(mainnetTowerSync.parsed.info.towerSync.blockId)).toBeInTheDocument();
    });
});

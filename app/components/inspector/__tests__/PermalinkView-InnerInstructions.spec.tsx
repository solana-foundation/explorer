/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { FetchStatus } from '@providers/cache';
import { useRawTransactionDetails } from '@providers/transactions/raw';
import { TransactionMessage } from '@solana/web3.js';
import { screen, waitFor } from '@testing-library/react';
import { INNER_INSTRUCTIONS_START_SLOT } from '@utils/index';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { renderWithProviders } from '@/app/__tests__/card-harness';
import type { RawTransaction } from '@/app/entities/transaction-data';
import { instructionParserDispatcher } from '@/app/tx/instruction-parser-dispatcher';

import { PermalinkView } from '../InspectorPage';
import { buildMessage, INNER_INSTRUCTIONS } from './__fixtures__/hoo-611';

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

vi.mock('@features/decode-instruction-with-idl', async importOriginal => ({
    ...(await importOriginal<typeof import('@features/decode-instruction-with-idl')>()),
    useIdlInstructionDecode: vi.fn(() => undefined),
}));

// The spread keeps the real `RawDetailsProvider`, which `TransactionsProvider` needs.
vi.mock('@providers/transactions/raw', async importOriginal => ({
    ...(await importOriginal<typeof import('@providers/transactions/raw')>()),
    useFetchRawTransaction: vi.fn(() => vi.fn()),
    useRawTransactionDetails: vi.fn(),
}));

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

// `ClusterProvider` defaults to mainnet, and `trustedInnerInstructions` checks the slot only on mainnet.
describe('PermalinkView inner instructions on mainnet', () => {
    beforeEach(() => {
        vi.mocked(useRawTransactionDetails).mockReset();
    });

    test('should render no inner instructions for a slot that predates them', async () => {
        renderAtSlot(INNER_INSTRUCTIONS_START_SLOT - 1);

        await screen.findByText(/Create Idempotent/i);
        expect(screen.queryByText(/Inner Instructions/i)).not.toBeInTheDocument();
    });

    test('should render inner instructions from the first slot that recorded them', async () => {
        renderAtSlot(INNER_INSTRUCTIONS_START_SLOT);

        expect(await screen.findByText(/Inner Instructions/i)).toBeInTheDocument();
        await waitFor(() => expect(document.body.textContent).toContain('#1.1'));
    });
});

function renderAtSlot(slot: number) {
    vi.mocked(useRawTransactionDetails).mockReturnValue({
        data: { raw: rawTransaction(slot) },
        status: FetchStatus.Fetched,
    } as unknown as ReturnType<typeof useRawTransactionDetails>);

    return renderWithProviders(
        <PermalinkView signature={SIGNATURE} reset={vi.fn()} showTokenBalanceChanges={false} />,
        { dispatcher: instructionParserDispatcher },
    );
}

function rawTransaction(slot: number): RawTransaction {
    const message = buildMessage();

    return {
        message,
        messageBytes: message.serialize(),
        meta: { innerInstructions: INNER_INSTRUCTIONS, postBalances: [], preBalances: [] },
        serializedSize: 0,
        signatures: [SIGNATURE],
        slot,
        transaction: TransactionMessage.decompile(message),
        version: 0,
    };
}

const SIGNATURE = '5wHu1qwD4kLwYnWMDLeMiNCrfJvnyLJzVAJhMRjGDSY4kJn8cZveuYpqbcJrY1EiNz4W9SRSKGbmiMiNqrTgBhTA';

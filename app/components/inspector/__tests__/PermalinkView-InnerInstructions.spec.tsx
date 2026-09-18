/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { FetchStatus } from '@providers/cache';
import { useRawTransactionDetails } from '@providers/transactions/raw';
import type { CompiledInnerInstruction } from '@solana/web3.js';
import { MessageV0, PublicKey, TransactionMessage } from '@solana/web3.js';
import { render, screen, waitFor } from '@testing-library/react';
import { INNER_INSTRUCTIONS_START_SLOT } from '@utils/index';
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { InstructionParserProvider } from '@/app/entities/instruction-parser';
import type { RawTransaction } from '@/app/entities/transaction-data';
import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { TransactionsProvider } from '@/app/providers/transactions';
import { instructionParserDispatcher } from '@/app/tx/instruction-parser-dispatcher';

import { PermalinkView } from '../InspectorPage';

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

// The view reads its transaction through these; the slot it carries is what the rule under test reads.
// Partial, since `TransactionsProvider` still needs the real `RawDetailsProvider` around the tree.
vi.mock('@providers/transactions/raw', async importOriginal => ({
    ...(await importOriginal<typeof import('@providers/transactions/raw')>()),
    useFetchRawTransaction: vi.fn(() => vi.fn()),
    useRawTransactionDetails: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(() => '/'),
    useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

// `ClusterProvider` defaults to mainnet, which is the only cluster the slot rule applies to.
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

    return render(
        <ScrollAnchorProvider>
            <ClusterProvider>
                <TransactionsProvider>
                    <AccountsProvider>
                        <InstructionParserProvider dispatcher={instructionParserDispatcher}>
                            <PermalinkView signature={SIGNATURE} reset={vi.fn()} showTokenBalanceChanges={false} />
                        </InstructionParserProvider>
                    </AccountsProvider>
                </TransactionsProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>,
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
const SYSTEM_PROGRAM = new PublicKey('11111111111111111111111111111111');
const TOKEN_PROGRAM = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ATA_PROGRAM = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const COMPUTE_BUDGET_PROGRAM = new PublicKey('ComputeBudget111111111111111111111111111111');

const ACCOUNT_KEYS = [
    new PublicKey('37vWB5RfLRpnhNobhzmwCRGZbynGd4je2NvppSjUsEdJ'),
    new PublicKey('4aa42XQFo45wc2PHQH21vahuyuFYCEZAH4G27xpGYqf6'),
    new PublicKey('CFRWXYp8zc2ftkF2Bv8jXmQu1qW67goZjSkKMjv6UV3P'),
    SYSTEM_PROGRAM,
    new PublicKey('AGRidUXLeDij9CJprkZx7WBXtTQC67jtfiwz293mVrJ'),
    COMPUTE_BUDGET_PROGRAM,
    TOKEN_PROGRAM,
    new PublicKey('97PALEbpPj7muiQqi2HXS8QukLsrrr1yfgKfvXjWtsUG'),
    ATA_PROGRAM,
];

const INNER_INSTRUCTIONS: CompiledInnerInstruction[] = [
    {
        index: 0,
        instructions: [
            { accounts: [4], data: '84eT', programIdIndex: 6 },
            {
                accounts: [0, 2],
                data: '11119os1e9qSs2u7TsThXqkBSRVFxhmYaFKFZ1waB2X7armDmvK3p5GmLdUxYdg3h7QSrL',
                programIdIndex: 3,
            },
        ],
    },
];

function buildMessage(): MessageV0 {
    return new MessageV0({
        addressTableLookups: [],
        compiledInstructions: [{ accountKeyIndexes: [0, 2, 7, 4, 3, 6], data: new Uint8Array([1]), programIdIndex: 8 }],
        header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 6, numRequiredSignatures: 1 },
        recentBlockhash: new PublicKey(new Uint8Array(32)).toBase58(),
        staticAccountKeys: ACCOUNT_KEYS,
    });
}

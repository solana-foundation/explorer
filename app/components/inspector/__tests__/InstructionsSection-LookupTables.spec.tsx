/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { AddressLookupTableAccount, Keypair, MessageV0, PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { InstructionParserProvider } from '@/app/entities/instruction-parser';
import { AccountsProvider, useAddressLookupTables } from '@/app/providers/accounts';
import { FetchStatus } from '@/app/providers/cache';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { TransactionsProvider } from '@/app/providers/transactions';
import { instructionParserDispatcher } from '@/app/tx/instruction-parser-dispatcher';

import { InstructionsSection } from '../InstructionsSection';

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

vi.mock('@/app/providers/accounts', async importOriginal => ({
    ...(await importOriginal<typeof import('@/app/providers/accounts')>()),
    useAddressLookupTables: vi.fn(() => []),
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

const FEE_PAYER = new PublicKey('37vWB5RfLRpnhNobhzmwCRGZbynGd4je2NvppSjUsEdJ');
const MEMO_PROGRAM = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
const TABLE_KEY = new PublicKey('4aa42XQFo45wc2PHQH21vahuyuFYCEZAH4G27xpGYqf6');
const LOOKED_UP = Keypair.generate().publicKey;

describe('Inspector InstructionsSection with address lookup tables', () => {
    beforeEach(() => {
        vi.mocked(useAddressLookupTables).mockReturnValue([]);
    });

    test('should report the table it could not fetch', () => {
        vi.mocked(useAddressLookupTables).mockReturnValue([[undefined, FetchStatus.FetchFailed]]);

        renderSection();

        expect(screen.getByText(`Failed to fetch address lookup table: ${TABLE_KEY.toBase58()}`)).toBeInTheDocument();
    });

    test('should wait while a table is still unresolved', () => {
        vi.mocked(useAddressLookupTables).mockReturnValue([undefined]);

        renderSection();

        expect(screen.getByText(/Loading/)).toBeInTheDocument();
        expect(screen.queryByText('#1')).not.toBeInTheDocument();
    });

    test('should decompile through a resolved table, and only once it resolves', () => {
        vi.mocked(useAddressLookupTables).mockReturnValue([undefined]);
        const { rerender } = renderSection();
        expect(screen.getByText(/Loading/)).toBeInTheDocument();

        vi.mocked(useAddressLookupTables).mockReturnValue([[lookupTable(), FetchStatus.Fetched]]);
        rerender(section());

        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.queryByText(/Failed to fetch address lookup table/)).not.toBeInTheDocument();
    });
});

function lookupTable(): AddressLookupTableAccount {
    return new AddressLookupTableAccount({
        key: TABLE_KEY,
        state: {
            addresses: [LOOKED_UP],
            authority: undefined,
            deactivationSlot: BigInt('18446744073709551615'),
            lastExtendedSlot: 372_654_321,
            lastExtendedSlotStartIndex: 0,
        },
    });
}

// A one-instruction message whose second account comes from the lookup table.
function buildMessage(): MessageV0 {
    return new MessageV0({
        addressTableLookups: [{ accountKey: TABLE_KEY, readonlyIndexes: [], writableIndexes: [0] }],
        compiledInstructions: [{ accountKeyIndexes: [0, 2], data: new Uint8Array([104, 105]), programIdIndex: 1 }],
        header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 1, numRequiredSignatures: 1 },
        recentBlockhash: new PublicKey(new Uint8Array(32)).toBase58(),
        staticAccountKeys: [FEE_PAYER, MEMO_PROGRAM],
    });
}

function section() {
    return (
        <ScrollAnchorProvider>
            <ClusterProvider>
                <TransactionsProvider>
                    <AccountsProvider>
                        <InstructionParserProvider dispatcher={instructionParserDispatcher}>
                            <InstructionsSection message={buildMessage()} />
                        </InstructionParserProvider>
                    </AccountsProvider>
                </TransactionsProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>
    );
}

function renderSection() {
    return render(section());
}

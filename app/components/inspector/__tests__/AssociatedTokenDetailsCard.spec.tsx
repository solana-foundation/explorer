/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import * as spl from '@solana/spl-token';
import { TransactionMessage } from '@solana/web3.js';
import { render, screen, waitFor } from '@testing-library/react';
import { describe } from 'vitest';

import { resolveAddressLookupTables } from '@/app/__tests__/mock-resolvers';
import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { createInstructionParserDispatcher, isParsedInstruction } from '@/app/entities/instruction-parser';
import { associatedTokenInstructionParser } from '@/app/features/decode-instruction-associated-token';
import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

import { AssociatedTokenDetailsCard } from '../associated-token/AssociatedTokenDetailsCard';

const dispatcher = createInstructionParserDispatcher([associatedTokenInstructionParser]);

describe('inspector::AssociatedTokenDetailsCard', () => {
    test('should render "CreateIdempotent" card', async () => {
        const index = 1;
        const m = mock.deserializeMessageV0(stubs.aTokenCreateIdempotentMsg);
        const lookups = resolveAddressLookupTables(m.addressTableLookups);
        const ti = TransactionMessage.decompile(m, {
            addressLookupTableAccounts: lookups,
        }).instructions[index];
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const ix = dispatcher.fromTransactionInstruction(ti);
        if (!isParsedInstruction(ix)) throw new Error('AT slice did not recognise fixture');

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <AssociatedTokenDetailsCard ix={ix} raw={ti} message={m} index={index} result={{ err: null }} />
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>,
        );

        await waitFor(
            () => {
                expect(screen.queryByText(/Loading/i)).toBeNull();
            },
            { interval: 50, timeout: 10000 },
        );
        [/Source/, /Account/, /Mint/, /Wallet/].forEach(pattern => {
            expect(screen.getByText(pattern)).toBeInTheDocument();
        });
        expect(screen.queryAllByText(/^System Program$/)).toHaveLength(2);
        expect(screen.queryAllByText(/^Token Program$/)).toHaveLength(2);
    });

    test('should render "Create" card', async () => {
        const index = 2;
        const m = mock.deserializeMessage(stubs.aTokenCreateMsgWithInnerCards);
        const lookups = resolveAddressLookupTables(m.addressTableLookups);
        const ti = TransactionMessage.decompile(m, {
            addressLookupTableAccounts: lookups,
        }).instructions[index];
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const ix = dispatcher.fromTransactionInstruction(ti);
        if (!isParsedInstruction(ix)) throw new Error('AT slice did not recognise fixture');

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <AssociatedTokenDetailsCard ix={ix} raw={ti} message={m} index={index} result={{ err: null }} />
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>,
        );
        // waitFor's act() boundary absorbs ClusterProvider's post-mount dispatch
        await waitFor(() => {
            expect(screen.getByText(/Associated Token Program: Create$/)).toBeInTheDocument();
            [/Source/, /Account/, /Mint/, /Wallet/].forEach(pattern => {
                expect(screen.getByText(pattern)).toBeInTheDocument();
            });
            expect(screen.queryAllByText(/^System Program$/)).toHaveLength(2);
            expect(screen.queryAllByText(/^Token Program$/)).toHaveLength(2);
        });
    });

    test('should render "RecoverNested" card', async () => {
        const index = 0;
        const m = mock.deserializeMessage(stubs.aTokenRecoverNestedMsg);
        const lookups = resolveAddressLookupTables(m.addressTableLookups);
        const ti = TransactionMessage.decompile(m, {
            addressLookupTableAccounts: lookups,
        }).instructions[index];
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const ix = dispatcher.fromTransactionInstruction(ti);
        if (!isParsedInstruction(ix)) throw new Error('AT slice did not recognise fixture');

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <AssociatedTokenDetailsCard ix={ix} raw={ti} message={m} index={index} result={{ err: null }} />
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>,
        );
        // waitFor's act() boundary absorbs ClusterProvider's post-mount dispatch
        await waitFor(() => {
            expect(screen.getByText(/Associated Token Program: Recover Nested/)).toBeInTheDocument();
            [/Destination/, /Nested Mint/, /Nested Owner/, /Nested Source/, /Owner Mint/, /^Owner$/].forEach(
                pattern => {
                    expect(screen.getByText(pattern)).toBeInTheDocument();
                },
            );
            expect(screen.queryAllByText(/^Token Program$/)).toHaveLength(2);
        });
    });
});

describe('inspector::AssociatedTokenDetailsCard with inner cards', () => {
    test('should render "CreateIdempotentDetailsCard"', async () => {
        const index = 1;
        const m = mock.deserializeMessageV0(stubs.aTokenCreateIdempotentMsgWithInnerCards);
        const lookups = resolveAddressLookupTables(m.addressTableLookups);
        const ti = TransactionMessage.decompile(m, {
            addressLookupTableAccounts: lookups,
        }).instructions[index];

        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const ix = dispatcher.fromTransactionInstruction(ti);
        if (!isParsedInstruction(ix)) throw new Error('AT slice did not recognise fixture');

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <AssociatedTokenDetailsCard ix={ix} raw={ti} message={m} index={index} result={{ err: null }} />
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>,
        );
        // Positive assertion forces waitFor to poll until the async render settles; the negative one alone would pass immediately.
        await waitFor(() => {
            expect(screen.getByText(/Associated Token Program: Create Idempotent/)).toBeInTheDocument();
            expect(screen.queryByText(/Inner Instructions/)).not.toBeInTheDocument();
        });
    });
});

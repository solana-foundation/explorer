import * as spl from '@solana/spl-token';
import { AddressLookupTableAccount, clusterApiUrl, Connection, TransactionMessage } from '@solana/web3.js';
import { render, screen, waitFor } from '@testing-library/react';
import { describe } from 'vitest';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

import { intoParsedInstruction } from '../../inspector/into-parsed-data';
import { AssociatedTokenDetailsCard } from '../associated-token/AssociatedTokenDetailsCard';

describe('inspector::AssociatedTokenDetailsCard', () => {
    test('should render "CreateIdempotent" card', async () => {
        const index = 1;
        const m = mock.deserializeMessageV0(stubs.aTokenCreateIdempotentMsg);
        const connection = new Connection(clusterApiUrl('mainnet-beta'));
        const lookups = await Promise.all(
            m.addressTableLookups.map(lookup =>
                connection.getAddressLookupTable(lookup.accountKey).then(val => val.value)
            )
        );
        const ti = TransactionMessage.decompile(m, {
            addressLookupTableAccounts: lookups.filter(x => x !== null) as AddressLookupTableAccount[],
        }).instructions[index];
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const ix = intoParsedInstruction(ti);

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <AssociatedTokenDetailsCard ix={ix} raw={ti} message={m} index={index} result={{ err: null }} />
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        await waitFor(
            () => {
                expect(screen.queryByText(/Loading/i)).toBeNull();
            },
            { interval: 50, timeout: 10000 }
        );
        [/Source/, /Account/, /Mint/, /Wallet/].forEach(pattern => {
            expect(screen.getByText(pattern)).toBeInTheDocument();
        });
        expect(screen.queryAllByText(/^System Program$/)).toHaveLength(3);
        expect(screen.queryAllByText(/^Token Program$/)).toHaveLength(3);
    });

    test('should render "Create" card', async () => {
        const index = 2;
        const m = mock.deserializeMessage(stubs.aTokenCreateMsgWithInnerCards);
        const connection = new Connection(clusterApiUrl('mainnet-beta'));
        const lookups = await Promise.all(
            m.addressTableLookups.map(lookup =>
                connection.getAddressLookupTable(lookup.accountKey).then(val => val.value)
            )
        );
        const ti = TransactionMessage.decompile(m, {
            addressLookupTableAccounts: lookups.filter(x => x !== null) as AddressLookupTableAccount[],
        }).instructions[index];
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const ix = intoParsedInstruction(ti);

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <AssociatedTokenDetailsCard ix={ix} raw={ti} message={m} index={index} result={{ err: null }} />
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.getByText(/Associated Token Program: Create$/)).toBeInTheDocument();
        [/Source/, /Account/, /Mint/, /Wallet/].forEach(pattern => {
            expect(screen.getByText(pattern)).toBeInTheDocument();
        });
        expect(screen.queryAllByText(/^System Program$/)).toHaveLength(3);
        expect(screen.queryAllByText(/^Token Program$/)).toHaveLength(3);
    });

    test('should render "RecoverNested" card', async () => {
        const index = 0;
        const m = mock.deserializeMessage(stubs.aTokenRecoverNestedMsg);
        const connection = new Connection(clusterApiUrl('mainnet-beta'));
        const lookups = await Promise.all(
            m.addressTableLookups.map(lookup =>
                connection.getAddressLookupTable(lookup.accountKey).then(val => val.value)
            )
        );
        const ti = TransactionMessage.decompile(m, {
            addressLookupTableAccounts: lookups.filter(x => x !== null) as AddressLookupTableAccount[],
        }).instructions[index];
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const ix = intoParsedInstruction(ti);

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <AssociatedTokenDetailsCard ix={ix} raw={ti} message={m} index={index} result={{ err: null }} />
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.getByText(/Associated Token Program: Recover Nested/)).toBeInTheDocument();
        [/Destination/, /Nested Mint/, /Nested Owner/, /Nested Source/, /Owner Mint/, /^Owner$/].forEach(pattern => {
            expect(screen.getByText(pattern)).toBeInTheDocument();
        });
        expect(screen.queryAllByText(/^Token Program$/)).toHaveLength(3);
    });
});

describe('inspector::AssociatedTokenDetailsCard with inner cards', () => {
    test('should render "CreateIdempotentDetailsCard"', async () => {
        const index = 1;
        const m = mock.deserializeMessageV0(stubs.aTokenCreateIdempotentMsgWithInnerCards);
        const connection = new Connection(clusterApiUrl('mainnet-beta'));
        const lookups = await Promise.all(
            m.addressTableLookups.map(lookup =>
                connection.getAddressLookupTable(lookup.accountKey).then(val => val.value)
            )
        );
        const ti = TransactionMessage.decompile(m, {
            addressLookupTableAccounts: lookups.filter(x => x !== null) as AddressLookupTableAccount[],
        }).instructions[index];

        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const ix = intoParsedInstruction(ti);

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <AssociatedTokenDetailsCard ix={ix} raw={ti} message={m} index={index} result={{ err: null }} />
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.queryByText(/Inner Instructions/)).not.toBeInTheDocument();
    });
});

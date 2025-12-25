import { intoParsedInstruction, intoParsedTransaction } from '@components/inspector/into-parsed-data';
import { ParsedInstruction, SystemProgram, TransactionMessage } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('next/navigation');

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { TransactionsProvider } from '@/app/providers/transactions';

import { SystemDetailsCard } from '../system/SystemDetailsCard';

describe('instruction::SystemDetailsCard', () => {
    test('should render SystemProgram::Transfer instruction', async () => {
        const index = 0;
        const m = mock.deserializeMessage(stubs.systemTransferMsg);
        const ti = TransactionMessage.decompile(m, { addressLookupTableAccounts: [] }).instructions[index];

        const parsedIx = intoParsedInstruction(ti);
        const tx = intoParsedTransaction(ti, m, [parsedIx]);

        expect(ti.programId.equals(SystemProgram.programId)).toBeTruthy();

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <TransactionsProvider>
                        <AccountsProvider>
                            <SystemDetailsCard
                                index={index}
                                ix={parsedIx as ParsedInstruction}
                                raw={ti}
                                result={{ err: null }}
                                tx={tx}
                            />
                        </AccountsProvider>
                    </TransactionsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.getByText(/System Program: Transfer/)).toBeInTheDocument();
    });

    test('should render SystemProgram::TransferWithSeed instruction', async () => {
        const index = 0;
        const m = mock.deserializeMessage(stubs.systemTransferWithSeedMsg);
        const ti = TransactionMessage.decompile(m, { addressLookupTableAccounts: [] }).instructions[index];

        const parsedIx = intoParsedInstruction(ti);
        const tx = intoParsedTransaction(ti, m, [parsedIx]);

        expect(ti.programId.equals(SystemProgram.programId)).toBeTruthy();

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <TransactionsProvider>
                        <AccountsProvider>
                            <SystemDetailsCard
                                index={index}
                                ix={parsedIx as ParsedInstruction}
                                raw={ti}
                                result={{ err: null }}
                                tx={tx}
                            />
                        </AccountsProvider>
                    </TransactionsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.getByText(/System Program: Transfer w\/ Seed/)).toBeInTheDocument();
    });
});

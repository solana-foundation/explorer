/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import {
    createInstructionParserDispatcher,
    isParsedInstruction,
    toParsedTransaction,
} from '@entities/instruction-parser';
import { systemInstructionParser } from '@features/decode-instruction-system';
import { SystemProgram, TransactionInstruction, TransactionMessage } from '@solana/web3.js';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

const dispatcher = createInstructionParserDispatcher([systemInstructionParser]);

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    useRouter: vi.fn(() => ({ push: vi.fn() })),
    useSearchParams: vi.fn(() => ({ get: vi.fn(), has: vi.fn(), toString: () => '' })),
}));

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

        const parsedIx = dispatchOrThrow(ti);
        const tx = toParsedTransaction(ti, m, [parsedIx]);

        expect(ti.programId.equals(SystemProgram.programId)).toBeTruthy();

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <TransactionsProvider>
                        <AccountsProvider>
                            <SystemDetailsCard index={index} ix={parsedIx} raw={ti} result={{ err: null }} tx={tx} />
                        </AccountsProvider>
                    </TransactionsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>,
        );
        // waitFor's act() boundary absorbs ClusterProvider's post-mount dispatch
        await waitFor(() => {
            expect(screen.getByText(/System Program: Transfer/)).toBeInTheDocument();
        });
    });

    test('should render SystemProgram::TransferWithSeed instruction', async () => {
        const index = 0;
        const m = mock.deserializeMessage(stubs.systemTransferWithSeedMsg);
        const ti = TransactionMessage.decompile(m, { addressLookupTableAccounts: [] }).instructions[index];

        const parsedIx = dispatchOrThrow(ti);
        const tx = toParsedTransaction(ti, m, [parsedIx]);

        expect(ti.programId.equals(SystemProgram.programId)).toBeTruthy();

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <TransactionsProvider>
                        <AccountsProvider>
                            <SystemDetailsCard index={index} ix={parsedIx} raw={ti} result={{ err: null }} tx={tx} />
                        </AccountsProvider>
                    </TransactionsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>,
        );
        // waitFor's act() boundary absorbs ClusterProvider's post-mount dispatch
        await waitFor(() => {
            expect(screen.getByText(/System Program: Transfer w\/ Seed/)).toBeInTheDocument();
        });
    });
});

function dispatchOrThrow(ti: TransactionInstruction) {
    const parsedIx = dispatcher.fromTransactionInstruction(ti);
    if (!isParsedInstruction(parsedIx)) throw new Error('System slice did not recognise fixture');
    return parsedIx;
}

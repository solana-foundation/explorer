import { intoParsedInstruction, intoParsedTransaction } from '@components/inspector/into-parsed-data';
import { intoTransactionInstructionFromVersionedMessage } from '@components/inspector/utils';
import { ParsedInstruction, PublicKey, TransactionMessage } from '@solana/web3.js';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('next/navigation');

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

import { InspectorInstructionCard } from '../../common/InspectorInstructionCard';
import { TokenDetailsCard } from '../token/TokenDetailsCard';

describe('instruction::TokenDetailsCard', () => {
    test('should render Token::Transfer instruction', async () => {
        const index = 3;
        const m = mock.deserializeMessageV0(stubs.tokenTransferMsg);
        const ti = intoTransactionInstructionFromVersionedMessage(m.compiledInstructions[index], m);

        const parsedIx = intoParsedInstruction(ti);
        const tx = intoParsedTransaction(ti, m, [parsedIx]);

        expect(ti.programId.equals(new PublicKey(TOKEN_PROGRAM_ADDRESS))).toBeTruthy();

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TokenDetailsCard
                            index={index}
                            InstructionCardComponent={InspectorInstructionCard}
                            ix={parsedIx as ParsedInstruction}
                            message={m}
                            raw={ti}
                            result={{ err: null }}
                            tx={tx}
                        />
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.getByText(/Token Program: Transfer/)).toBeInTheDocument();
    });

    test('should render Token::TransferChecked instruction', async () => {
        const index = 1;
        const m = mock.deserializeMessage(stubs.tokenTransferCheckedMsg);
        const ti = TransactionMessage.decompile(m, { addressLookupTableAccounts: [] }).instructions[index];

        const parsedIx = intoParsedInstruction(ti);
        const tx = intoParsedTransaction(ti, m, [parsedIx]);

        expect(ti.programId.equals(new PublicKey(TOKEN_PROGRAM_ADDRESS))).toBeTruthy();

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TokenDetailsCard
                            index={index}
                            InstructionCardComponent={InspectorInstructionCard}
                            ix={parsedIx as ParsedInstruction}
                            message={m}
                            raw={ti}
                            result={{ err: null }}
                            tx={tx}
                        />
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.getByText(/Token Program: Transfer \(Checked\)/)).toBeInTheDocument();
    });
});

import { intoTransactionInstructionFromVersionedMessage } from '@components/inspector/utils';
import * as spl from '@solana/spl-token';
import { render, screen } from '@testing-library/react';

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
        const mci = m.compiledInstructions[index];
        const ti = intoTransactionInstructionFromVersionedMessage(mci, m);
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const ix = intoParsedInstruction(ti);

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <AssociatedTokenDetailsCard
                            ix={ix}
                            raw={mci}
                            message={m}
                            index={index}
                            result={{ err: null }}
                        />
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.getByText(/Associated Token Program: Create Idempotent/)).toBeInTheDocument();
        [/Source/, /Account/, /Mint/, /Wallet/].forEach(pattern => {
            expect(screen.getByText(pattern)).toBeInTheDocument();
        });
        expect(screen.queryAllByText(/^System Program$/)).toHaveLength(3);
        expect(screen.queryAllByText(/^Token Program$/)).toHaveLength(1);
    });

    test('should render "Create" card', async () => {
        const index = 2;
        const m = mock.deserializeMessage(stubs.aTokenCreateMsgWithInnerCards);
        const mci = m.compiledInstructions[index];
        const ti = intoTransactionInstructionFromVersionedMessage(mci, m);
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const ix = intoParsedInstruction(ti);

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <AssociatedTokenDetailsCard
                            ix={ix}
                            raw={mci}
                            message={m}
                            index={index}
                            result={{ err: null }}
                        />
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
        const mci = m.compiledInstructions[index];
        const ti = intoTransactionInstructionFromVersionedMessage(mci, m);
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const ix = intoParsedInstruction(ti);

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <AssociatedTokenDetailsCard
                            ix={ix}
                            raw={mci}
                            message={m}
                            index={index}
                            result={{ err: null }}
                        />
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
        const mci = m.compiledInstructions[index];
        const ti = intoTransactionInstructionFromVersionedMessage(mci, m);
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const ix = intoParsedInstruction(ti);

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <AssociatedTokenDetailsCard
                            ix={ix}
                            raw={mci}
                            message={m}
                            index={index}
                            result={{ err: null }}
                        />
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.queryByText(/Inner Instructions/)).not.toBeInTheDocument();
    });
});

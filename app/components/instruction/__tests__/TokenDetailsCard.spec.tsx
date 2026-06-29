/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { intoTransactionInstructionFromVersionedMessage } from '@components/inspector/utils';
import {
    createInstructionParserDispatcher,
    isParsedInstruction,
    toParsedTransaction,
} from '@entities/instruction-parser';
import { tokenInstructionParser } from '@features/decode-instruction-token';
import { PublicKey, TransactionInstruction, TransactionMessage } from '@solana/web3.js';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

const dispatcher = createInstructionParserDispatcher([tokenInstructionParser]);

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

import { InspectorInstructionCard } from '../../common/InspectorInstructionCard';
import { TokenDetailsCard } from '../token/TokenDetailsCard';

describe('instruction::TokenDetailsCard', () => {
    beforeEach(() => {
        // shouldAdvanceTime keeps waitFor's polling alive while the original setTimeout fix stays in place
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.useRealTimers();
    });
    test('should render Token::Transfer instruction', async () => {
        const index = 3;
        const m = mock.deserializeMessageV0(stubs.tokenTransferMsg);
        const ti = intoTransactionInstructionFromVersionedMessage(m.compiledInstructions[index], m);

        const parsedIx = dispatchOrThrow(ti);
        const tx = toParsedTransaction(ti, m, [parsedIx]);

        expect(ti.programId.equals(new PublicKey(TOKEN_PROGRAM_ADDRESS))).toBeTruthy();

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TokenDetailsCard
                            index={index}
                            InstructionCardComponent={InspectorInstructionCard}
                            ix={parsedIx}
                            message={m}
                            raw={ti}
                            result={{ err: null }}
                            tx={tx}
                        />
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>,
        );
        // waitFor's act() boundary absorbs ClusterProvider's post-mount dispatch
        await waitFor(() => {
            expect(screen.getByText(/Token Program: Transfer/)).toBeInTheDocument();
        });
    });

    test('should render Token::TransferChecked instruction', async () => {
        const index = 1;
        const m = mock.deserializeMessage(stubs.tokenTransferCheckedMsg);
        const ti = TransactionMessage.decompile(m, { addressLookupTableAccounts: [] }).instructions[index];

        const parsedIx = dispatchOrThrow(ti);
        const tx = toParsedTransaction(ti, m, [parsedIx]);

        expect(ti.programId.equals(new PublicKey(TOKEN_PROGRAM_ADDRESS))).toBeTruthy();

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TokenDetailsCard
                            index={index}
                            InstructionCardComponent={InspectorInstructionCard}
                            ix={parsedIx}
                            message={m}
                            raw={ti}
                            result={{ err: null }}
                            tx={tx}
                        />
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>,
        );
        // waitFor's act() boundary absorbs ClusterProvider's post-mount dispatch
        await waitFor(() => {
            expect(screen.getByText(/Token Program: Transfer \(Checked\)/)).toBeInTheDocument();
        });
    });
});

function dispatchOrThrow(ti: TransactionInstruction) {
    const parsedIx = dispatcher.fromTransactionInstruction(ti);
    if (!isParsedInstruction(parsedIx)) throw new Error('Token slice did not recognise fixture');
    return parsedIx;
}

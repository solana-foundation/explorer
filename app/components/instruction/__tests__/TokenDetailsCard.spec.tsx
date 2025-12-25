import { intoTransactionInstructionFromVersionedMessage } from '@components/inspector/utils';
import { ParsedInstruction, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { render, screen } from '@testing-library/react';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { intoPartialParsedTransactionFromTransactionInstruction } from '@/app/utils/parsed-tx';
import { parseSPLTokenInstruction } from '@/app/components/inspector/instruction-parsers/spl-token.parser';

import { InspectorInstructionCard } from '../../common/InspectorInstructionCard';
import { TokenDetailsCard } from '../token/TokenDetailsCard';

describe('instruction::TokenDetailsCard', () => {
    test('should render "CreateIdempotentDetailsCard"', async () => {
        const index = 3;
        const m = mock.deserializeMessageV0(stubs.tokenTransferMsg);
        const ti = intoTransactionInstructionFromVersionedMessage(m.compiledInstructions[index], m);

        const tx = intoPartialParsedTransactionFromTransactionInstruction(ti, m, [], parseSPLTokenInstruction);

        expect(ti.programId.equals(new PublicKey(TOKEN_PROGRAM_ADDRESS))).toBeTruthy();

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TokenDetailsCard
                            index={index}
                            InstructionCardComponent={InspectorInstructionCard}
                            ix={tx.message.instructions[0] as ParsedInstruction}
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
});

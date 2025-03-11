import { BaseInstructionCard } from '@components/common/BaseInstructionCard';
import { intoTransactionInstructionFromVersionedMessage } from '@components/inspector/utils';
import * as spl from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

import { intoParsedInstruction, intoParsedTransaction } from '../../inspector/into-parsed-data';
import { AssociatedTokenDetailsCard } from '../associated-token/AssociatedTokenDetailsCard';

jest.mock('next/navigation');

describe('instruction::AssociatedTokenDetailsCard', () => {
    beforeEach(() => {
        mock.mockUseSearchParams();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should render "CreateIdempotentDetailsCard"', async () => {
        const index = 1;
        const m = mock.deserializeMessageV0(stubs.aTokenCreateIdempotentMsg);
        const ti = intoTransactionInstructionFromVersionedMessage(m.compiledInstructions[index], m);
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const parsed = {
            account: new PublicKey('Fv8YYjF2DUqj9RZhyXNzXa4yR9nHHwjg5bFjA82UidF1'),
            mint: new PublicKey('74SBV4zDXxTRgv1pEMoECskKBkZHc2yGPnc7GYVepump'),
            source: new PublicKey('EzdQH5zUfTMGb3vwU4oumxjVcxKMDpJ6dB78pbjfHmmb'),
            systemProgram: new PublicKey('11111111111111111111111111111111'),
            tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            wallet: new PublicKey('EzdQH5zUfTMGb3vwU4oumxjVcxKMDpJ6dB78pbjfHmmb'),
        };

        const ix = intoParsedInstruction(ti, parsed);
        const tx = intoParsedTransaction(ti, m);

        console.log({ix}, tx)

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AssociatedTokenDetailsCard
                        ix={ix}
                        index={index}
                        result={{ err: null }}
                        tx={tx}
                        InstructionCardComponent={BaseInstructionCard}
                    />
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.getByText(/Associated Token Program: Create Idempotent/)).toBeInTheDocument();
    });
});
